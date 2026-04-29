/**
 * Constants for chart line widths (used in supplier rating chart).
 */
export const CHART_PRIMARY_BORDER_WIDTH = 3;
export const CHART_SECONDARY_BORDER_WIDTH = 1.5;
export const CHART_PRIMARY_POINT_RADIUS = 5;
export const CHART_SECONDARY_POINT_RADIUS = 3;

/**
 * Interface for the form configuration
 * @description This interface declares the configuration of a form section
 */
export interface FormSection {
  sectionTitle: string;
  fields: FieldMeta[];
}

/**
 * Interface for the fields metadata of the form
 * @description This interface declares the metadata of a form field in a form section
 */
export interface FieldMeta {
  key: string; // Technical name
  label: string; // Displayed name for the UI
  required: boolean;
  requiredIfContact?: boolean;
  type: 'textarea' | 'number' | 'rating' | 'stat-total';
  gridClass?: string; // CSS-Class for the col-width (e.g. 'col-12', 'col-md-6')
  placeholder?: string;
  color?: string; // Line color when this field is shown in the rating history chart
  isPrimary?: boolean; // Marks the primary chart line (rendered on top, thicker)
}

/**
 * Central configuration for displaying rating-form sections
 */
export const RATING_FORM_CONFIG: FormSection[] = [
  {
    sectionTitle: 'Bewertung',
    fields: [
      { key: 'quality', label: 'Qualität', required: true, type: 'rating', gridClass: 'col-12', color: '#198754' },
      {
        key: 'qualityReason',
        label: 'Begründung Qualität',
        required: true,
        type: 'textarea',
        gridClass: 'col-12',
      },
      { key: 'cost', label: 'Kosten', required: true, type: 'rating', gridClass: 'col-12', color: '#fd7e14' },
      { key: 'costReason', label: 'Begründung Kosten', required: true, type: 'textarea', gridClass: 'col-12' },
      {
        key: 'reliability',
        label: 'Termintreue',
        required: true,
        type: 'rating',
        gridClass: 'col-12',
        color: '#6f42c1',
      },
      {
        key: 'reliabilityReason',
        label: 'Begründung Termintreue',
        required: true,
        type: 'textarea',
        gridClass: 'col-12',
      },
      {
        key: 'availability',
        label: 'Verfügbarkeit Ansprechperson',
        required: false,
        requiredIfContact: true,
        type: 'rating',
        gridClass: 'col-12',
        color: '#20c997',
      },
      {
        key: 'availabilityReason',
        label: 'Begründung Verfügbarkeit',
        required: false,
        requiredIfContact: true,
        type: 'textarea',
        gridClass: 'col-12',
      },
      {
        key: 'totalScore',
        label: 'Ergebnis Gesamtbewertung',
        required: false,
        type: 'stat-total',
        gridClass: 'col-12',
        color: '#0d6efd',
        isPrimary: true,
      },
      {
        key: 'ratingComment',
        label: 'Kommentar zur Bewertung',
        required: false,
        type: 'textarea',
        gridClass: 'col-12',
      },
    ],
  },
];
