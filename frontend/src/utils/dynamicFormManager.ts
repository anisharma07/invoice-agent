import { TemplateData, AppMappingItem } from "../types/template";

export interface DynamicFormField {
  label: string;
  value: string;
  type: "text" | "email" | "number" | "decimal" | "textarea" | "date";
  cellMapping: string;
}

export interface DynamicFormSection {
  title: string;
  fields: DynamicFormField[];
  isItems?: boolean;
  itemsConfig?: {
    name: string;
    range: { start: number; end: number };
    content: { [key: string]: string };
  };
}

export interface ProcessedFormData {
  [sectionKey: string]: any;
}

/**
 * Utility class for managing dynamic form generation based on AppMapping
 */
export class DynamicFormManager {
  /**
   * Cleans up HTML entities and unwanted characters from cell values
   */
  private static cleanCellValue(rawValue: any): string {
    if (!rawValue) {
      return "";
    }

    // Handle numeric values
    if (typeof rawValue === "number") {
      return rawValue.toString();
    }

    // Convert to string and clean up HTML entities
    let cleanValue = rawValue.toString();

    // Replace common HTML entities
    cleanValue = cleanValue
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#160;/g, " ")
      .replace(/&#xa0;/g, " ")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Remove any remaining HTML tags
    cleanValue = cleanValue.replace(/<[^>]*>/g, "");

    if (!cleanValue || cleanValue.trim() === "") {
      return "";
    }

    return cleanValue;
  }

  /**
   * Determines the field type based on the field label
   */
  static getFieldType(
    label: string
  ): "text" | "email" | "number" | "decimal" | "textarea" | "date" {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("email")) return "email";
    if (lowerLabel.includes("date")) return "date";
    if (lowerLabel.includes("number") || lowerLabel.includes("#"))
      return "number";
    if (
      lowerLabel.includes("rate") ||
      lowerLabel.includes("amount") ||
      lowerLabel.includes("price") ||
      lowerLabel.includes("tax") ||
      lowerLabel.includes("hours") ||
      lowerLabel.includes("qty") ||
      lowerLabel.includes("quantity")
    )
      return "decimal";
    if (lowerLabel.includes("notes") || lowerLabel.includes("description"))
      return "textarea";
    return "text";
  }

  /**
   * Generates form sections from app mapping
   */
  static generateFormSections(mapping: { [key: string]: AppMappingItem }): DynamicFormSection[] {
    if (!mapping) return [];

    const sections: DynamicFormSection[] = [];

    // Prioritize sections: Heading, Date, InvoiceNumber, From, BillTo, Items
    // But we iterate keys, so order might depend on definition.
    // We can sort or just process.

    const processItem = (key: string, item: AppMappingItem) => {
      // Skip images for form generation (Logo, Signature) usually not text inputs
      if (item.type === 'image') return;

      if (item.type === 'table') {
        const columns: { [key: string]: string } = {};
        if (item.col) {
          Object.keys(item.col).forEach(colKey => {
            const colItem = item.col![colKey];
            if (colItem.cell) {
              columns[colKey] = colItem.cell;
            }
          });
        }

        sections.push({
          title: key,
          fields: [],
          isItems: true,
          itemsConfig: {
            name: item.unitname || 'Item',
            range: item.rows || { start: 0, end: 0 },
            content: columns
          }
        });
      } else if (item.type === 'form') {
        // Form type (e.g. From, BillTo) containing nested fields
        const fields: DynamicFormField[] = [];

        // Recursive helper to flatten nested forms if necessary, 
        // but typically "From" has "Name", "Address" which are text.
        // If "From" has nested "Address" -> "Street", we might want "Address Street".

        const processFormContent = (content: { [key: string]: AppMappingItem }, prefix: string = "") => {
          Object.keys(content).forEach(subKey => {
            const subItem = content[subKey];
            if (subItem.type === 'text') {
              fields.push({
                label: prefix ? `${prefix} ${subKey}` : subKey,
                value: "",
                type: this.getFieldType(subKey),
                cellMapping: subItem.cell || ""
              });
            } else if (subItem.type === 'form' && subItem.formContent) {
              processFormContent(subItem.formContent, prefix ? `${prefix} ${subKey}` : subKey);
            }
          });
        };

        if (item.formContent) {
          processFormContent(item.formContent);
        }

        if (fields.length > 0) {
          sections.push({
            title: key,
            fields
          });
        }

      } else if (item.type === 'text') {
        // Simple text field at top level (e.g. Heading, Date, InvoiceNumber)
        // We ensure these get their own section? Or group them?
        // Current UI typically puts these in distinct inputs or "General" section?
        // Old logic: "Simple field mapping" -> create a section with 1 field.
        sections.push({
          title: key, // e.g. "Heading"
          fields: [{
            label: key,
            value: "",
            type: this.getFieldType(key),
            cellMapping: item.cell || ""
          }]
        });
      }
    };

    Object.keys(mapping).forEach(key => {
      processItem(key, mapping[key]);
    });

    return sections;
  }

  /**
   * Initializes form data based on form sections
   */
  static initializeFormData(sections: DynamicFormSection[]): ProcessedFormData {
    const formData: ProcessedFormData = {};

    sections.forEach((section) => {
      if (section.isItems && section.itemsConfig) {
        // Initialize items array with just one item
        const itemsArray: any[] = [];
        const item: any = {};
        Object.keys(section.itemsConfig.content).forEach((contentKey) => {
          item[contentKey] = "";
        });
        itemsArray.push(item);
        formData[section.title] = itemsArray;
      } else {
        // Initialize regular fields
        const sectionData: any = {};
        section.fields.forEach((field) => {
          sectionData[field.label] = "";
        });
        formData[section.title] = sectionData;
      }
    });

    return formData;
  }

  /**
   * Validates form data - currently no validation rules applied
   */
  static validateFormData(
    formData: ProcessedFormData,
    sections: DynamicFormSection[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    // No validation rules - all data is accepted
    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Converts form data to spreadsheet format for cell mapping
   */
  static convertToSpreadsheetFormat(
    formData: ProcessedFormData,
    sections: DynamicFormSection[],
    sheetId?: string | number
  ): { [cellRef: string]: any } {
    const cellData: { [cellRef: string]: any } = {};

    sections.forEach((section) => {
      if (section.isItems && section.itemsConfig) {
        const items = formData[section.title] as any[];

        if (items && items.length > 0) {
          items.forEach((item, index) => {
            const rowNumber = section.itemsConfig!.range.start + index;

            const hasItemData = Object.values(item).some((value) => {
              const trimmedValue = String(value || "").trim();
              return trimmedValue !== "" && trimmedValue !== "0";
            });

            if (hasItemData) {
              Object.entries(section.itemsConfig!.content).forEach(
                ([fieldName, columnLetter]) => {
                  const cellRef = `${columnLetter}${rowNumber}`;
                  const value = item[fieldName];
                  const trimmedValue = String(value || "").trim();

                  if (trimmedValue !== "" && trimmedValue !== "0") {
                    cellData[cellRef] = value;
                  }
                }
              );
            }
          });
        }

        // Clear unused rows
        const usedRowsCount = items
          ? items.filter((item) => {
            return Object.values(item).some((value) => {
              const trimmedValue = String(value || "").trim();
              return trimmedValue !== "" && trimmedValue !== "0";
            });
          }).length
          : 0;

        for (
          let rowIndex = usedRowsCount;
          rowIndex <=
          section.itemsConfig.range.end - section.itemsConfig.range.start;
          rowIndex++
        ) {
          const rowNumber = section.itemsConfig.range.start + rowIndex;
          Object.entries(section.itemsConfig.content).forEach(
            ([fieldName, columnLetter]) => {
              const cellRef = `${columnLetter}${rowNumber}`;
              cellData[cellRef] = "";
            }
          );
        }
      } else {
        section.fields.forEach((field) => {
          const value = formData[section.title]?.[field.label];
          const trimmedValue = String(value || "").trim();
          if (trimmedValue !== "" && field.cellMapping) {
            cellData[field.cellMapping] = value;
          }
        });
      }
    });

    return cellData;
  }

  /**
   * Converts spreadsheet cell data back to form data structure
   */
  static convertFromSpreadsheetFormat(
    cellData: { [cellRef: string]: any },
    sections: DynamicFormSection[]
  ): ProcessedFormData {
    const formData: ProcessedFormData = {};

    sections.forEach((section) => {
      if (section.isItems && section.itemsConfig) {
        const itemsArray: any[] = [];

        for (
          let rowIndex = section.itemsConfig.range.start;
          rowIndex <= section.itemsConfig.range.end;
          rowIndex++
        ) {
          const item: any = {};
          let hasData = false;

          Object.entries(section.itemsConfig.content).forEach(
            ([fieldName, columnLetter]) => {
              const cellRef = `${columnLetter}${rowIndex}`;
              const rawValue = cellData[cellRef] || "";
              const cleanValue = this.cleanCellValue(rawValue);
              item[fieldName] = cleanValue;

              if (
                cleanValue &&
                cleanValue !== "0" &&
                cleanValue.trim() !== ""
              ) {
                hasData = true;
              }
            }
          );

          if (
            hasData ||
            (itemsArray.length === 0 &&
              rowIndex === section.itemsConfig.range.start)
          ) {
            itemsArray.push(item);
          }
        }

        if (itemsArray.length === 0) {
          const emptyItem: any = {};
          Object.keys(section.itemsConfig.content).forEach((fieldName) => {
            emptyItem[fieldName] = "";
          });
          itemsArray.push(emptyItem);
        }

        formData[section.title] = itemsArray;
      } else {
        const sectionData: any = {};
        section.fields.forEach((field) => {
          if (field.cellMapping) {
            const rawValue = cellData[field.cellMapping] || "";
            sectionData[field.label] = this.cleanCellValue(rawValue);
          }
        });
        formData[section.title] = sectionData;
      }
    });

    return formData;
  }

  /**
   * Gets all cell references from form sections
   */
  static getAllCellReferences(sections: DynamicFormSection[]): string[] {
    const cellRefs: string[] = [];

    sections.forEach((section) => {
      if (section.isItems && section.itemsConfig) {
        for (
          let rowIndex = section.itemsConfig.range.start;
          rowIndex <= section.itemsConfig.range.end;
          rowIndex++
        ) {
          Object.entries(section.itemsConfig.content).forEach(
            ([fieldName, columnLetter]) => {
              cellRefs.push(`${columnLetter}${rowIndex}`);
            }
          );
        }
      } else {
        section.fields.forEach((field) => {
          if (field.cellMapping) {
            cellRefs.push(field.cellMapping);
          }
        });
      }
    });

    return cellRefs;
  }

  /**
   * Gets the active footer from a template
   */
  static getActiveFooter(template: TemplateData) {
    if (!template.footers) return null;
    return (
      template.footers.find((footer) => footer.isActive) ||
      template.footers[0] ||
      null
    );
  }

  /**
   * Gets form sections based on current sheet ID
   */
  static getFormSectionsForSheet(
    template: TemplateData,
    sheetId: string
  ): DynamicFormSection[] {
    if (!template.appMapping) return [];

    // Fallback or mapping? "sheet1" is default usually.
    // If sheetId is not in appMapping, checking if we can default to first key?
    // But `sheetId` passed here should be valid.

    const mapping = template.appMapping[sheetId];
    if (!mapping) return [];

    return this.generateFormSections(mapping);
  }

  /**
   * Filters form sections based on footer index (Legacy support or if footer index maps to sheet name)
   */
  static getFormSectionsForFooter(
    template: TemplateData,
    footerIndex: number
  ): DynamicFormSection[] {
    // In new structure, we don't map footer index to mappings directly unless footer index implies sheet?
    // Usually footer index corresponds to sheets?
    // Let's assume footerIndex maps to "sheet"+footerIndex for now, or use mapped keys.
    // For now, return empty or try sheet1?
    // The previous implementation used template.cellMappings[footerIndex].
    // Our migration script mapped everything to "sheet1".

    // If footerIndex is 1, maybe "sheet1".
    const sheetName = `sheet${footerIndex}`;
    const mapping = template.appMapping && template.appMapping[sheetName];

    if (mapping) {
      return this.generateFormSections(mapping);
    }

    // Fallback: If only one sheet mapping exists, use it?
    if (template.appMapping && Object.keys(template.appMapping).length === 1) {
      const firstKey = Object.keys(template.appMapping)[0];
      return this.generateFormSections(template.appMapping[firstKey]);
    }

    return [];
  }
}
