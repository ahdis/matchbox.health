---
title: ""
date: 2026-09-26
author: Oliver Egger
github: oliveregger
summary: ""
tags: []
matchbox: 4.1.18
original: https://www.ahdis.ch/en/blog/2026/matchbox-memory
---

<!--
Notes for the agent: this is the ahdis.ch article of 26 September 2026,
republished on matchbox.health. Keep the text unchanged: same order, same
wording, same tables. Move the title and the byline line into the front
matter, write the summary and the tags, check the links and build.
-->

# Matchbox: from 12 GB to 4 GB – 24 hours with an AI agent and a test setup

Sep 26, 2026 · @Oliver Egger

In 24 hours, [Matchbox](https://www.matchbox.health/) went from a fixed 12 GB heap to a 4 GB container for a typical validation server. The work was done by an AI agent, Claude Code with Opus 5.5: it ran the builds, the load tests and the heap dump analysis, and proposed and implemented the optimizations, while a human stayed in the loop for every decision. This article describes how we got there, and why a reproducible load test mattered as much as the agent.

## Matchbox and why validation matters

[FHIR®](https://hl7.org/fhir/), the HL7 standard for healthcare interoperability, leaves a lot of freedom in how data is represented. To guarantee the correctness of an exchange like a lab report or a patient summary, FHIR resources are validated against the rules published in FHIR implementation guides (IGs): which fields are required, which codes are allowed, which cardinalities apply.

[Matchbox](https://github.com/ahdis/matchbox) is our open-source FHIR validation and mapping tooling. It wraps the official [HL7 FHIR validator](https://confluence.hl7.org/spaces/FHIR/pages/35718580/Using+the+FHIR+Validator) in a server with its own FHIR API and a web GUI, supports multiple IGs at once, and also offers validation through an [MCP service](https://ahdis.github.io/matchbox/validation-with-ai-tutorial/). We started in August 2020 and have published [98 releases](https://github.com/ahdis/matchbox/releases) since then. It runs in production infrastructure (e.g. the Swiss notification of laboratory results, [ch-elm](https://fhir.ch/ig/ch-elm/api.html)), in test platforms such as [IHE Gazelle](https://gazelle.ihe.net/?page_id=147) at [IHE connectathons](https://www.ihe.net/testing/connectathon/) and [projectathons](https://ehealthsuisse.ihe-europe.net/gazelle/home), and in integration pipelines.

## Memory became the bottleneck

FHIR IGs tend to get bigger: to stay aligned with international developments, they depend on European and international IGs, and each new terminology dependency makes validation hungrier for memory. Initially, we assumed this was a natural evolution and let the container grow. Then we were asked why an existing validation setup needed four times the memory within one year. In addition, several issues and pull requests from the community pointed to memory problems:

- Achraf ([@achrafachkari](https://github.com/achrafachkari)) found that the human-readable HTML narrative of every loaded resource stayed in memory ([#566](https://github.com/ahdis/matchbox/issues/566)).
- Valentin ([@reva](https://github.com/reva)) measured better throughput with a smaller heap than the image's default of 12 GB and asked for configurable JVM options ([#594](https://github.com/ahdis/matchbox/issues/594), [#595](https://github.com/ahdis/matchbox/pull/595)).
- We ourselves hit an `OutOfMemoryError` on [our memory-constrained test instance](https://test.ahdis.ch/matchboxv3/), while the health check still reported the server as up ([#457](https://github.com/ahdis/matchbox/issues/457)).

In release 4.1.14 we had already added [memory metrics](https://ahdis.github.io/matchbox/docker/#live-and-readiness-checks) to Matchbox, but observing the problem was not enough. Fortunately, we also had [test setups for load testing](https://github.com/ahdis/matchbox/tree/main/jmeter).

## The test setup: reproduce before you optimize

The test setups were mostly used to reproduce concurrency issues in validation: [Apache JMeter](https://jmeter.apache.org/) sends 8,000 validations of a ch-elm lab report (4 threads) to a Matchbox container and asks the server for its memory use after each one. The results were trustworthy, but the comparison was manual on my development machine, and reruns were difficult to compare because the machine load could differ between runs.

So we first made the measurements reproducible. A script starts a fresh container and records the startup time, the first and the second validation, and the live heap. All runs happened on the same idle machine. To check servers with several IGs, a [second JMeter test](https://github.com/ahdis/matchbox/blob/main/jmeter/multi-ig.jmx) validates examples from different IGs, each of which gets its own validation engine. For a validator, a faster answer is worthless if it is a different answer, so every run also compared the validation results.

## Working with an AI agent

Extending the test setup and the analysis were all done with [Claude Code](https://claude.com/claude-code) and Opus 5.5 (high effort) within VS Code. My job was to set the direction, review the findings and make every decision. What Claude Opus 5.5 did:

- **Bisecting across releases.** It pulled or rebuilt ten [ch-elm images](https://github.com/ahdis/matchbox-ch-elm) of the last nine months (Matchbox [4.0.16](https://github.com/ahdis/matchbox/releases/tag/v4.0.16) to [4.1.18](https://github.com/ahdis/matchbox/releases/tag/v4.1.18)), ran the same load test on each, and found in which release validation became slower and in which it became faster again, to get a clearer view of the problem.
- **Profiling and heap dumps.** With [Java Flight Recorder](https://en.wikipedia.org/wiki/JDK_Flight_Recorder) it recorded which code paths parsed resources. With [Eclipse Memory Analyzer](https://eclipse.dev/mat/) it analyzed heap dumps in headless mode: which objects keep the memory alive, per package and per validation engine.
- **Reading upstream code, recommending and implementing optimizations.** It compared Matchbox with the official HL7 validator in [org.hl7.fhir.core](https://github.com/hapifhir/org.hl7.fhir.core), changed the code, ran the tests and repeated the measurements until the numbers and the validation results matched.

In 24 hours this added up to about 35 load and startup test runs, 17 Docker image builds, 10 Matchbox versions compared and 9 heap dumps analyzed.

## The culprits in memory consumption

The heap dumps showed where the memory went. For ch-elm, 44,650 conformance resources (profiles, value sets, code systems) were loaded, all parsed into Java objects, consuming about 1 GB. The IG and its dependencies alone pull in seven versions of the [HL7 terminology](https://terminology.hl7.org/) package. The main culprits and their fixes:

1. **Leftover package files (−171 MB).** For a handful of small files, a helper kept a reference to the whole package it came from. So all raw files of `hl7.fhir.r4.core` and `hl7.fhir.uv.xver-r5.r4` (210 MB) stayed in memory. It now keeps only the file it needs, which lowers the live heap by 171 MB.
2. **Identical strings (−15%, about 220 MB).** The many package versions contain a lot of identical text. Java's [string deduplication](https://openjdk.org/jeps/192) (`-XX:+UseStringDeduplication`) lets the garbage collector share it, at no measurable cost. It is now on by default.
3. **Everything parsed up front (−330 MB).** The official validator loads resources lazily: it registers each resource with some metadata and parses it only when a validation needs it. Matchbox had never adopted this for its package loading. Now the terminology resources (code systems, value sets, naming systems, concept maps) are loaded lazily. Matchbox also pins the terminology resources of the FHIR core to their core versions; this step now reads the versions from the metadata instead of parsing every resource.
4. **Unused definitions of the database layer (−40 MB).** The search indexing of the underlying [HAPI FHIR](https://hapifhir.io/) server loaded all 649 FHIR core profiles for a type analysis it never uses.

The agent discovered all four of these issues and presented approaches to solve them. Not every idea worked. Loading *all* resources lazily made the first validation take 2.4 instead of 0.85 seconds, because the validator walks through all profiles on first use anyway. So profiles are parsed at startup, like in the official validator, and terminology on demand.

## Results for a single IG

For ch-elm, a typical production setup with one IG, the [ch-elm image](https://github.com/ahdis/matchbox-ch-elm) 1.15.3 (based on Matchbox 4.1.18) needs 660 MB of heap. That is less than a third of image 1.13.1, which still ran with 3 GB, and a fifth of image 1.14.1, which needs 3.4 GB and no longer fits into 3 GB. It validates three times faster than 1.13.1, and as fast as 1.15.2. Compared with 1.15.2, the memory drops by more than half and the server starts about 25% faster. Startup is still slower than with 1.13.1; as each image changes both the Matchbox and the ch-elm version, the two effects can't be separated here.

| Matchbox release (ch-elm image) | 4.0.16 (1.13.1) | 4.1.9 (1.14.1) | 4.1.17 (1.15.2) | 4.1.18 (1.15.3) |
| --- | --- | --- | --- | --- |
| Heap limit of the image | 3 GB | 12 GB | 12 GB | 70% of the container memory |
| Live heap after 8,000 validations | 2,300 MB | 3,420 MB | 1,560 MB | 660 MB |
| Server ready after | 36–37 s | 43–46 s | 65–67 s | 48–49 s |
| Validation under load (median of 8,000) | 327 ms | 250 ms | 104 ms | 108 ms |
| Runs the load test in a 3 GB heap | Yes | No (live heap 3.4 GB) | Yes | Yes, also in 1 GB |

## Several IGs: share what engines have in common

Matchbox creates one validation engine per IG/validation parameters, so that the rules of one IG cannot interfere with another. The heap dumps showed that, apart from the FHIR core and the base terminology, each engine loaded all its packages again. Swiss IGs share most of their dependencies, so with twelve IGs, 133,000 resource objects existed more than once: 2.3 GB of duplicates. Now a cache shares the loaded packages between the engines. It keeps only weak references, so a package is freed when the last engine using it is dropped after an hour without use.

We measured this with [with-preload](https://github.com/ahdis/matchbox/tree/main/matchbox-server/with-preload), a sample configuration of Matchbox that preloads 12 Swiss IGs with their dependencies (55 packages). With the new default in a container with a 4 GB limit (a heap of 2.8 GB), all 12 engines ran 400 validations without failures and used 3.5 GB of the container's memory.

| with-preload: 12 Swiss IGs, 55 packages | Release 4.1.9 | Release 4.1.17 | Release 4.1.18 |
| --- | --- | --- | --- |
| Heap limit of the image | 12 GB | 12 GB | 70% of the container memory |
| Live heap with all 12 engines | 10,630 MB | 4,756 MB | 1,187 MB |
| Memory held by the 12 IG engines alone | 8,123 MB | 3,465 MB | 177 MB |
| Duplicated between engines | n.a. | 2,278 MB | 1 MB |
| Creating an IG engine (median) | 19 s | 48 s | 16 s |

## What changes for you as a Matchbox user

The changes are released in [Matchbox 4.1.18](https://github.com/ahdis/matchbox/releases/tag/v4.1.18) and the [ch-elm image 1.15.3](https://github.com/ahdis/matchbox-ch-elm/releases/tag/1.15.3):

- **A new memory default.** The [Docker image](https://ahdis.github.io/matchbox/docker/#jvm-options) no longer sets a fixed 12 GB heap, which could even exceed the memory limit of a container. It now uses 70% of the container's memory limit (`-XX:MaxRAMPercentage=70`).
- **4 GB is enough for a typical setup.** We recommend a memory limit of 4 GB for the container, also for multiple IGs. A single IG such as ch-elm runs comfortably with 3 GB.
- **Configurable JVM options.** The options can be overridden with the `JDK_JAVA_OPTIONS` environment variable ([#594](https://github.com/ahdis/matchbox/issues/594)). Setting it replaces the default, so include a heap setting, `-XX:+ExitOnOutOfMemoryError` and `-XX:+UseStringDeduplication`.
- **A restart instead of a zombie.** On the first `OutOfMemoryError`, the server now exits (`-XX:+ExitOnOutOfMemoryError`) instead of continuing in an undefined state while the health check reports it as up, so that Docker or Kubernetes can restart it ([#457](https://github.com/ahdis/matchbox/issues/457)).
- **Faster engines.** Compared with 4.1.17, the server starts about 25% faster and creates IG engines three times faster.

```bash
docker run -d --name matchbox -p 8080:8080 -m 4g europe-west6-docker.pkg.dev/ahdis-ch/ahdis/matchbox:latest
```

## Lessons: a day instead of weeks with an agent

I could have done almost all of this myself. I'm familiar with load testing, bisecting releases, profiling and heap dump analysis, but less so with tools such as JFR or Eclipse Memory Analyzer. Even after we noticed the memory problem, I could not find the time: each step means waiting for a 30-minute test run, writing heap dump queries or reading code in a large upstream project.

Opus 5.5 took over exactly these steps: it ran them continuously, one after another and in parallel, in one session of 1 million tokens. I let it write a whole [runbook](https://github.com/ahdis/matchbox/blob/main/jmeter/claude-jmeter-check.md) and continued in a new session the next day, to verify that the setup can be reused and this is not a one-shot optimization.

The agent found features in the core libraries that we had missed, and proposed new approaches, such as sharing the loaded FHIR packages between the engines. I had not seen these qualities in agentic coding before. Opus 4.7 was the first model that could handle the Matchbox code, but Opus 5.5 is another leap: it can be used for software engineering, not just coding.

The reproducible test setup made this possible. Every proposal of the agent was measured against the same load test on the same machine, and every run checked that the validation results stayed the same. Every pull request goes through our Matchbox [engine](https://github.com/ahdis/matchbox/tree/main/matchbox-engine/src/test) and [server tests](https://github.com/ahdis/matchbox/tree/main/matchbox-server/src/test), which check specific validation features, and our [integration tests](https://github.com/ahdis/matchbox-int-tests), which check that the examples of the IGs we are interested in are still validated correctly. Without that, we could neither have trusted the improvements nor rejected the wrong ideas.

And a human in the loop stays essential. The agent proposed, measured and implemented, but not every proposal was right. Loading only the newest version of each terminology package would have saved 400 MB, but the IGs depend on specific versions, and validating against just the latest terminology version can change the results. Loading all resources lazily saved memory but made the first validation three times slower. I knew that multiple package versions are needed, which trade-offs are acceptable, and when a proposal was wrong.

In one day we delivered a Matchbox release that needs a fraction of the memory. But it needs the community to raise awareness and bring urgency to the problems, so thanks again to Achraf ([@achrafachkari](https://github.com/achrafachkari)), Valentin ([@reva](https://github.com/reva)) and especially my colleague Quentin ([@qligier](https://github.com/qligier)), co-maintainer of Matchbox, who has to review all my pull requests co-authored with Claude Code.

Disclaimer: As with the code, I used Claude to help me with this blog article, but I read and refined every sentence.
