'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { categoryHue } from '@/lib/events/categoryHue'
import { flyerFallbackStyle, flyerInitial } from '@/lib/events/flyerFallback'
import { isOptimizableFlyer } from '@/lib/images'

type FlyerImageProps = Omit<ImageProps, 'src'> & {
  src: string
  /** Event title; the fallback tile shows its first letter. Defaults to alt. */
  title?: string
  /** Event category, for the fallback tile's hue. */
  category?: string
}

// Event flyers are external, often full-size (500KB+) images shown as small
// thumbnails. Known hosts get resized through next/image; unknown hosts fall
// back to the raw image. When the source image no longer resolves, the tile
// keeps its box and shows a category-hued placeholder instead of a broken
// image icon (#4).
export function FlyerImage({
  src,
  alt,
  title,
  category,
  className,
  width,
  height,
  style,
  onError,
  ...props
}: FlyerImageProps) {
  const [failed, setFailed] = useState(false)

  // A flyer that 404s before hydration never reaches onError, so check the
  // element once it mounts as well: complete with no intrinsic width is the
  // browser's own verdict that the image did not load.
  const checkAlreadyFailed = (node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth === 0) setFailed(true)
  }

  if (failed) {
    const label = (title ?? (typeof alt === 'string' ? alt : '')).trim()
    const decorative = alt === ''
    const side = Math.min(Number(width ?? 0), Number(height ?? 0))
    const fontSize = side > 0 ? Math.min(96, Math.max(18, Math.round(side * 0.4))) : 20
    return (
      <div
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : alt}
        className={`flex items-center justify-center font-display ${className ?? ''}`}
        style={{
          aspectRatio: width && height ? `${width} / ${height}` : undefined,
          ...flyerFallbackStyle(categoryHue(category)),
          ...style,
        }}
      >
        <span aria-hidden="true" style={{ fontSize, lineHeight: 1 }}>
          {flyerInitial(label)}
        </span>
      </div>
    )
  }

  return (
    <Image
      ref={checkAlreadyFailed}
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={style}
      unoptimized={!isOptimizableFlyer(src)}
      onError={event => {
        setFailed(true)
        onError?.(event)
      }}
      {...props}
    />
  )
}
