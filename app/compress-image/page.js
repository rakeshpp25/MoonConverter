import ImageCompressor from '../components/ImageCompressor';

export const metadata = {
  title: 'Advanced Local Image Compressor',
  description: 'Compress images to an exact target size (KB) or use a quality slider 100% offline and locally.',
};

export default function CompressImagePage() {
  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <ImageCompressor />
    </div>
  );
}