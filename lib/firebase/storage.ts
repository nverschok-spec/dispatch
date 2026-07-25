import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from './config';

const storage = getStorage(app);

export async function uploadDoctorAvatar(praxisId: string, doctorId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `practices/${praxisId}/doctors/${doctorId}/avatar.${ext}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

// Handwerk intake photos — uploaded client-side before the booking record exists,
// so they live under a client-generated draftId until the appointment is created.
// Expects a canvas-re-encoded JPEG blob (see stripExifAndResize below): drawing onto
// a <canvas> and re-exporting drops all EXIF metadata (incl. GPS geotags), which is
// the DSGVO-relevant bit — intake photos of a customer's home must not leak location
// via EXIF independently of the address the customer explicitly typed in.
export async function uploadBookingPhoto(praxisId: string, draftId: string, blob: Blob, index: number): Promise<string> {
  const path = `practices/${praxisId}/booking-drafts/${draftId}/photo-${index}.jpg`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(fileRef);
}

// Draws the source file onto a canvas and re-exports as JPEG — strips all EXIF
// metadata (GPS location, camera model, timestamps) as a side effect, and caps
// the longest edge so intake photos don't balloon Storage costs.
export function stripExifAndResize(file: File, maxEdge = 1600, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas_unsupported')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('canvas_export_failed'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image_load_failed')); };
    img.src = url;
  });
}
