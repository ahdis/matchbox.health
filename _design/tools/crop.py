#!/usr/bin/env python3
"""Crop a region out of a PNG screenshot (no third-party imaging deps)."""
import zlib, struct, sys

def load(path):
    d=open(path,'rb').read(); pos=8; idat=b''
    while pos<len(d):
        ln=struct.unpack('>I',d[pos:pos+4])[0]; t=d[pos+4:pos+8]
        if t==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',d[pos+8:pos+18])
        elif t==b'IDAT': idat+=d[pos+8:pos+8+ln]
        pos+=12+ln
    bpp=4 if ct==6 else 3; stride=w*bpp
    raw=zlib.decompress(idat); rows=[]; prev=bytearray(stride); i=0
    for y in range(h):
        f=raw[i]; i+=1; line=bytearray(raw[i:i+stride]); i+=stride
        for x in range(stride):
            a=line[x-bpp] if x>=bpp else 0; b=prev[x]; c=prev[x-bpp] if x>=bpp else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                p=a+b-c; pa,pb,pc=abs(p-a),abs(p-b),abs(p-c)
                pr=a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                line[x]=(line[x]+pr)&255
        rows.append(bytes(line)); prev=line
    return w,h,rows,bpp

def save(path, rows, w, h, bpp):
    raw=b''.join(b'\x00'+r for r in rows)
    def chunk(t,data):
        c=t+data; return struct.pack('>I',len(data))+c+struct.pack('>I',zlib.crc32(c)&0xffffffff)
    ct = 6 if bpp==4 else 2
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,ct,0,0,0))
    png+=chunk(b'IDAT',zlib.compress(raw,6))+chunk(b'IEND',b'')
    open(path,'wb').write(png)

src,dst,x,y,cw,ch = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7])
w,h,rows,bpp = load(src)
x,y = max(0,x), max(0,y); cw,ch = min(cw,w-x), min(ch,h-y)
save(dst, [rows[yy][x*bpp:(x+cw)*bpp] for yy in range(y,y+ch)], cw, ch, bpp)
print(f"  {dst}  {cw}x{ch} from {src} @ {x},{y}")
