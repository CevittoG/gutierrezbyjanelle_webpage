/**
 * item-previews.ts
 *
 * Canonical map from stationery item labels → portfolio image paths.
 * Keys are lowercase; lookup is case-insensitive via getFeaturePreview().
 *
 * To add a new preview: add one entry here. No component changes needed.
 * To use on any page: import { HoverPreviewItem } from "@/components/ui/hover-preview-item"
 *                     and call getFeaturePreview(label) for the imageSrc prop.
 */

export const itemPreviewMap: Record<string, string> = {
  // "invite":                                  "/invitation/invite-3.png",
  // "rsvp card":                               "/invitation/invite-3.png",
  // "rsvp":                                    "/invitation/invite-3.png",
  // "save the date":                           "/invitation/invite-4.png",
  // "detail card":                             "/invitation/invite-4.png",
  // "ceremony cards":                          "/gallery/ceremony-card.jpeg",
  // "welcome sign":                            "/gallery/welcome-sign.jpeg",
  // "drink toppers":                           "/gallery/signature-drink-topper.jpeg",
  // "table top signs (signature drink sign)":  "/gallery/signature-drink-sign.jpeg",
};

/**
 * Returns the portfolio preview image path for a given feature label,
 * or undefined if no preview is mapped (renders plain text).
 */
export function getFeaturePreview(label: string): string | undefined {
  return itemPreviewMap[label.toLowerCase()];
}
