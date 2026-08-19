# Privacy policy — what was changed, and what is flagged but untouched

The policy was ported **verbatim** from the Squarespace site, then the five
edits below were applied so it describes how the site actually works after the
move to GitHub Pages.

**This is legal text. Please have it reviewed before the cutover.** Every change
is listed with its exact before/after so a reviewer does not have to diff HTML.
The verbatim extraction is preserved for comparison at
`_reference/squarespace/pages/privacy-policy.html`.

One change (item 1) **adds** a disclosure rather than correcting one. It is
called out separately below because it is the only place where new obligations
are described rather than existing text corrected.

---

## Changes made

### 1. Section 1 — newsletter text replaced with a web-analytics disclosure

This is the one substantive addition, and it closes a gap that existed **before**
the migration: the site has run Google Analytics (`G-NJ6P4XSZMC`) all along, and
the policy never mentioned analytics anywhere. It also described a newsletter
that does not exist — there is no signup on the site and no newsletter is sent.

**Removed in full:** the sub-heading *"Use and optimization of our newsletter"*
and the two paragraphs after it, covering signup data, newsletter analytics and
the unsubscribe link. No occurrence of "newsletter" remains.

**Added in its place:**

> **Use of web analytics**
>
> If you agree to it, we use Google Analytics, a service of Google Ireland
> Limited, to measure and analyse the use of the Website. Google Analytics sets
> cookies and collects usage data such as the pages you visit and the time you
> spend on them. Your IP address is shortened before it is stored, and no
> analytics data is collected unless you have accepted analytics cookies. We use
> the resulting reports only in aggregate form, to understand which parts of the
> Website are useful.

Both claims in that paragraph are enforced by the build: `site.js` initialises
Consent Mode to `denied`, does not fetch the Google tag at all until Accept, and
sets `anonymize_ip: true`. Verified by `_design/tools/test-consent.mjs`, which
records zero requests to Google before consent and after Decline.

Section 3 already carried the bullet *"Analysis and improvement of the use of
the Website"* as a legal basis, so the basis itself is not new — only its
description.

### 2. Section 2 — the cookie statement understated the actual handling

**Before**
> Some of the cookies we use are necessary in order to make available certain
> features of the Website or our products. You can set your preferences in your
> browser.

**After**
> Some of the cookies we use are necessary in order to make available certain
> features of the Website or our products. In addition, we use cookies to enable
> web analytics. Analytics cookies are only set if you agree to them: when you
> first visit the Website you are asked whether to allow them, and none are set
> unless you accept. You can change that decision at any time, and you can also
> set your preferences in your browser.

"change that decision at any time" is a working link that brings the consent
banner back, so the sentence is literally true rather than aspirational.

### 3. Section 6 — place of data processing

The statement that became false the moment the site moved to GitHub.

**Before**
> We store and process your personal data in Switzerland. However, in order to
> achieve some of the purposes described in this Privacy Policy, it may also be
> necessary for us to process your personal data in countries outside
> Switzerland and the EU or to transfer it to such countries.

**After**
> This Website is hosted on GitHub Pages, a service of GitHub, Inc. (United
> States), and delivered through its global content delivery network. The server
> log data described in section 1 is therefore processed by GitHub outside
> Switzerland. Other personal data we collect, for example when you contact us
> or when you use our products and services, is stored and processed in
> Switzerland.
>
> In order to achieve some of the purposes described in this Privacy Policy, it
> may also be necessary for us to process your personal data in further countries
> outside Switzerland and the EU or to transfer it to such countries.

The sentence that follows, about standard data protection clauses and legal
exceptions, is unchanged and still carries the transfer.

### 4. Section 7 — named the hosting provider as a recipient

**Before:** "* External service providers,"
**After:** "* External service providers, including the provider hosting this
Website (GitHub, Inc.),"

### 5. Section 7 — recipient locations

**Before:** "Such recipients are usually based in Switzerland, or in an EU or EEA
member state."
**After:** "…or in an EU or EEA member state; our hosting provider is based in
the United States."

---

## Flagged, deliberately not changed

These are inaccuracies or oddities in the original. Changing them is a business
decision, not a migration correction, so they were left alone.

1. **"If you contact us using our contact forms…"** (section 1) and **"Protection
   against misuse of our contact forms"** (section 3). `www.matchbox.health` has
   no form and never had one — its Contact link goes to `www.ahdis.ch/en/contact`,
   which does. The sentences describe ahdis's contact channels generally rather
   than this Website's, so they remain true; but if you want the policy to be
   strictly about this site, these two should go.

2. **Two different addresses for the same company.** Section 9 names
   *"c/o The Hub Zürich Association"* while the footer says *"c/o Impact Hub
   Zürich"*. Both were already inconsistent on the live site. The footer text is
   reproduced verbatim and section 9 is untouched.

3. **"Last updated: 29 March 2023"** is now wrong given these amendments. Updating
   it is a one-line change once you have reviewed the text — deliberately left
   for you rather than dated on your behalf.

4. **Section 1 still describes registration, invoicing and payment data** for
   "our products". That is about Matchbox as software, not about this Website,
   and is unaffected by the migration.

## Unaffected by the migration

- Sections 4, 5, 8 and 10 are untouched.
- Section 3's purposes and legal bases are untouched apart from nothing being
  removed; the analytics purpose was already listed.
