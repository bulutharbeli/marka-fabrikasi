declare module 'imagetracerjs' {
  export interface TracerOptions {
    loglevel?: number;
    strokewidth?: number;
    lineart?: number;
    colored?: number;
    numberofcolors?: number;
    pathomit?: number;
    layeropacity?: number;
    strokewidths?: number;
    colorquantcycles?: number;
    blur?: number;
    blurRadius?: number;
    maxwidth?: number;
    maxheight?: number;
    viewbox?: boolean;
  }
  const Imagetracer: {
    imagedataToSVG(imgd: { data: Uint8ClampedArray; width: number; height: number }, options?: TracerOptions): string;
    imageToSVG(img: HTMLImageElement, options?: TracerOptions): string;
  };
  export default Imagetracer;
}
