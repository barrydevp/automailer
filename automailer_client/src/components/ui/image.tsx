import * as React from "react";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (props, ref) => {
    return <img ref={ref} {...props} />;
  },
);
Image.displayName = "Image";
