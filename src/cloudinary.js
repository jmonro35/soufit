const CLOUD  = 'dyeubignt'
const PRESET = 'SouPhotos'

export async function uploadPhoto(blob) {
  const fd = new FormData()
  fd.append('file', blob)
  fd.append('upload_preset', PRESET)
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd })
  const data = await res.json()
  if (!data.secure_url) throw new Error('Upload failed')
  return { url: data.secure_url, publicId: data.public_id }
}
