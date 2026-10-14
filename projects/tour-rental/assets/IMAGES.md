# ORIVELA campaign image provenance

These images were generated specifically for the ORIVELA luxury redesign using the available OpenAI image-generation tool. They depict imaginary, unbranded yachts and coastal settings, not real inventory, confirmed destinations, or photographs of an operator. No stock download, external image URL, or reference screenshot is shipped. The supplied design reference informed the atmosphere; its pixels, wording, and interface were not copied into these assets.

| Local asset               | Dimensions  | Purpose                                                                                                                |
| ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `yacht-night.webp`        | 1536 × 1024 | Original cinematic, low waterline, front three-quarter superyacht hero; also used in the gallery and Signature package |
| `yacht-night-960.webp`    | 960 × 640   | Smaller desktop source and portfolio preview                                                                           |
| `yacht-night-mobile.webp` | 768 × 1152  | Separately generated portrait adaptation of the original night scene, composed for mobile                              |
| `yacht-deck.webp`         | 1280 × 853  | Original imagined teak lounge and sunset coast                                                                         |
| `yacht-cove.webp`         | 1280 × 853  | Original imagined superyacht anchored in a limestone cove                                                              |

Creative direction: deep navy ocean and sky, physically plausible vessel details, warm cabin lighting, champagne reflections, quiet exclusive travel. Hero typography and precision arcs remain real HTML/SVG rather than baked-in text. All scenes have no logo or typography.

Generated PNG masters remain in the task's `/workspace/generated_images` directory; only optimized delivery files are committed. ImageMagick performed resolution reduction, metadata stripping, and WebP encoding at quality 83–85. The desktop hero is approximately 170 KiB; the five shipped WebP variants together are under 1 MiB. There is no runtime generation or processing requirement.

The hero uses `<picture>` for mobile art direction and `srcset` for desktop sizing. Supporting images load lazily. Page copy and image alternative text identify the imagery as AI-generated concepts. The pricing model is a separate fictional demonstration, not a quote for the vessel shown.

The previous original vector studies (`coast.svg`, `sunset.svg`, `islands.svg`) are retained as earlier work and are no longer referenced by the live demo or its portfolio card.
