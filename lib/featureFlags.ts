export function isGalleryCaptionsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_GALLERY_CAPTIONS === 'true';
}

export function isCalendlyBookingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_CALENDLY_BOOKING === 'true';
}
