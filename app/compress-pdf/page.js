import PdfCompressor from '../components/PdfCompressor';

export const metadata = {
  title: 'Secure Tiered PDF Compressor',
  description: 'Reduce PDF file size while keeping vector text sharp 100% locally in your browser.',
};

export default function CompressPdfPage() {
  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <PdfCompressor />
    </div>
  );
}