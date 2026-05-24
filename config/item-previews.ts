/**
 * item-previews.ts
 *
 * Canonical map from stationery item labels → portfolio image paths + orientation.
 * Keys are lowercase; lookup is case-insensitive via getFeaturePreview().
 *
 * orientation: "portrait"  → tall frame (default for invites, cards, etc.)
 *              "landscape" → wide frame (for RSVP cards, save-the-dates, etc.)
 *
 * To add a new preview: add one entry here. No component changes needed.
 * To use on any page: import { HoverPreviewItem } from "@/components/ui/hover-preview-item"
 *                     and spread getFeaturePreview(label) directly onto the component.
 */

export type PreviewOrientation = "portrait" | "landscape";

interface PreviewEntry {
  imageSrc: string;
  orientation: PreviewOrientation;
}

export const itemPreviewMap: Record<string, PreviewEntry> = {
  "invite":                                  { imageSrc: "/item_preview_map/invite.jpeg",                          orientation: "portrait"  },
  "rsvp card":                               { imageSrc: "/item_preview_map/rsvp.jpeg",                           orientation: "landscape" },
  "rsvp":                                    { imageSrc: "/item_preview_map/rsvp.jpeg",                           orientation: "landscape" },
  "save the date":                           { imageSrc: "/item_preview_map/save_the_date.jpeg",                  orientation: "landscape" },
  "detail card":                             { imageSrc: "/item_preview_map/detail.jpeg",                         orientation: "portrait"  },
  "ceremony card front":                     { imageSrc: "/item_preview_map/ceremony_card.jpeg",                  orientation: "portrait"  },
  "ceremony card back":                      { imageSrc: "/item_preview_map/ceremony_card_back_timeline.jpeg",    orientation: "portrait"  },
  "personalized guest settings":             { imageSrc: "/item_preview_map/guest_place_setting.jpeg",            orientation: "portrait"  },
  "place cards":                             { imageSrc: "/item_preview_map/guest_place_setting.jpeg",            orientation: "portrait"  },
};

/**
 * Returns { imageSrc, orientation } for a given feature label,
 * or undefined if no preview is mapped (HoverPreviewItem renders plain text).
 *
 * Designed to be spread directly onto HoverPreviewItem:
 *   <HoverPreviewItem label={f} {...getFeaturePreview(f)} />
 */
export function getFeaturePreview(label: string): PreviewEntry | undefined {
  return itemPreviewMap[label.toLowerCase()];
}
