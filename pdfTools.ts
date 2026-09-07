import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();

export type CompressionLevel = 'recommended' | 'extreme' | 'less';
export type ResizePreset = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal';

const MIME_PDF = 'application/pdf';

export function blobUrl(blob: Blob) { return URL.createObjectURL(blob); }
export function downloadBlob(blob: Blob, filename: string) {
  const url = blobUrl(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function bytes(file: File) { return new Uint8Array(await file.arrayBuffer()); }

export async function mergePDF(files: File[]) {
  if (files.length < 2) throw new Error('Please select at least 2 PDF files to merge.');
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await bytes(file), { ignoreEncryption: false });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach(p => out.addPage(p));
  }
  const data = await out.save({ useObjectStreams: true });
  return new Blob([data], { type: MIME_PDF });
}

function parseRanges(input: string, pageCount: number): number[] {
  if (!input.trim()) throw new Error('Please specify page ranges for splitting.');
  const set = new Set<number>();
  for (const token of input.split(',')) {
    const t = token.trim(); if (!t) continue;
    if (/^\d+$/.test(t)) { const n = Number(t); if (n < 1 || n > pageCount) throw new Error(`Page ${n} is outside the document.`); set.add(n - 1); continue; }
    const m = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!m) throw new Error(`Invalid range: ${t}`);
    let a = Number(m[1]), b = Number(m[2]); if (a > b) [a,b] = [b,a];
    if (a < 1 || b > pageCount) throw new Error(`Range ${t} is outside the document.`);
    for (let n=a; n<=b; n++) set.add(n-1);
  }
  return [...set].sort((a,b)=>a-b);
}

export async function splitPDF(file: File, ranges: string) {
  const src = await PDFDocument.load(await bytes(file));
  const selected = parseRanges(ranges, src.getPageCount());
  const groups: number[][] = [];
  // A range creates one output; comma-separated single/ranges are kept as one selection if they overlap.
  const tokens = ranges.split(',').map(s=>s.trim()).filter(Boolean);
  for (const token of tokens) {
    const indexes = parseRanges(token, src.getPageCount());
    if (indexes.length) groups.push(indexes);
  }
  if (!groups.length) groups.push(selected);
  const zip = new JSZip();
  for (let i=0;i<groups.length;i++) {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, groups[i]); copied.forEach(p=>out.addPage(p));
    zip.file(`split_part_${i+1}.pdf`, await out.save({useObjectStreams:true}));
  }
  const blob = await zip.generateAsync({type:'blob', compression:'DEFLATE'});
  return { blob, filename: groups.length === 1 ? 'split.pdf' : 'split_pdfs.zip', single: groups.length === 1 ? await makeSingle(src, groups[0]) : null };
}
async function makeSingle(src:any, indexes:number[]) { const out=await PDFDocument.create(); (await out.copyPages(src,indexes)).forEach((p:any)=>out.addPage(p)); return new Blob([await out.save({useObjectStreams:true})],{type:MIME_PDF}); }

export async function compressPDF(file: File, level: CompressionLevel) {
  const src = await PDFDocument.load(await bytes(file));
  // Browser-safe, dependency-free optimization: rebuilds the document, drops metadata and enables object streams.
  // It is lossless; file size reduction is workload-dependent rather than guaranteed.
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach(p=>out.addPage(p));
  out.setTitle(''); out.setAuthor(''); out.setSubject(''); out.setKeywords([]); out.setProducer('PDFMaster Pro Toolkit'); out.setCreator('PDFMaster');
  const data = await out.save({ useObjectStreams:true, addDefaultPage:false });
  const blob = new Blob([data], {type:MIME_PDF});
  return { blob, originalSize:file.size, newSize:blob.size, level };
}

async function extractPagesText(file: File) {
  const loading = pdfjsLib.getDocument({ data: await bytes(file) });
  const pdf = await loading.promise; const pages: {text:string, width:number, height:number}[]=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i); const viewport=page.getViewport({scale:1});
    const content=await page.getTextContent();
    const items=(content.items as any[]).filter(x=>typeof x.str==='string');
    const text=items.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim();
    pages.push({text,width:viewport.width,height:viewport.height});
  }
  return pages;
}

export async function pdfToWord(file: File) {
  const pages=await extractPagesText(file); const children: Paragraph[]=[];
  pages.forEach((p,i)=>{ children.push(new Paragraph({children:[new TextRun({text:`Page ${i+1}`,bold:true})]})); children.push(new Paragraph(p.text || '[No extractable text on this page]')); });
  const doc=new Document({sections:[{properties:{},children}]});
  const blob=await Packer.toBlob(doc); return blob;
}

export async function pdfToExcel(file: File) {
  const pages=await extractPagesText(file); const rows=[['Page','Extracted text']];
  pages.forEach((p,i)=>rows.push([String(i+1),p.text || '[No extractable text on this page]']));
  const ws=XLSX.utils.aoa_to_sheet(rows); ws['!cols']=[{wch:10},{wch:110}]; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'PDF Text');
  const data=XLSX.write(wb,{bookType:'xlsx',type:'array'}); return new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

export async function pdfToPpt(file: File) {
  const data=await bytes(file); const pdf=await pdfjsLib.getDocument({data}).promise; const ppt=new PptxGenJS(); ppt.layout='LAYOUT_WIDE';
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i); const base=page.getViewport({scale:1}); const scale=1200/base.width; const viewport=page.getViewport({scale});
    const canvas=document.createElement('canvas'); canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height); const ctx=canvas.getContext('2d')!;
    await page.render({canvasContext:ctx,viewport}).promise; const slide=ppt.addSlide(); slide.background={color:'FFFFFF'}; slide.addImage({data:canvas.toDataURL('image/png'),x:0,y:0,w:13.333,h:7.5});
  }
  const out=await ppt.write({outputType:'blob'} as any); return out as Blob;
}

const sizes:Record<ResizePreset,[number,number]>={A4:[595.28,841.89],A3:[841.89,1190.55],A5:[419.53,595.28],Letter:[612,792],Legal:[612,1008]};
export async function resizePDF(file: File, preset: ResizePreset, landscape:boolean) {
  const src=await PDFDocument.load(await bytes(file)); const out=await PDFDocument.create(); const [pw,ph]=sizes[preset]; const W=landscape?ph:pw, H=landscape?pw:ph;
  for(const idx of src.getPageIndices()){
    const [p]=await out.copyPages(src,[idx]); const old=p.getSize(); p.setSize(W,H);
    const scale=Math.min(W/old.width,H/old.height); p.setMediaBox(0,0,W,H); p.scaleContent(scale,scale); p.translateContent((W-old.width*scale)/2,(H-old.height*scale)/2); out.addPage(p);
  }
  return new Blob([await out.save({useObjectStreams:true})],{type:MIME_PDF});
}

export async function editPDF(file: File, text: string, pageNumber:number) {
  if(!text.trim()) throw new Error('Enter text to add to the PDF.');
  const pdf=await PDFDocument.load(await bytes(file)); const page=pdf.getPage(Math.max(0,Math.min(pdf.getPageCount()-1,pageNumber-1))); const font=await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(text,{x:50,y:page.getHeight()-80,size:16,font,color:rgb(0.12,0.12,0.2)});
  return new Blob([await pdf.save({useObjectStreams:true})],{type:MIME_PDF});
}
