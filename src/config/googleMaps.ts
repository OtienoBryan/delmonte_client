import type { Libraries } from '@react-google-maps/api';

/**
 * Single shared Maps JS API options. useJsApiLoader / Loader must be called with
 * identical options across the app (see "Loader must not be called again with different options").
 */
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyDw2uB49lArHYU9raM_rEYn0zTIHO1a5OI';

/** Module-level stable reference — do not create a new array per render. */
export const GOOGLE_MAPS_LIBRARIES: Libraries = ['maps', 'places'];
