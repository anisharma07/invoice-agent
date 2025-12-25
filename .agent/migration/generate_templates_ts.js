const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'output.json');
const targetPath = path.join(__dirname, '../../frontend/src/templates.ts');

const jsonData = fs.readFileSync(outputPath, 'utf8');

const staticContent = `export let APP_NAME = "Invoice Suite";

export interface AppMappingItem {
  type: "text" | "image" | "table" | "form";
  cell?: string;
  editable?: boolean;
  unitname?: string;
  rows?: { start: number; end: number };
  col?: { [columnKey: string]: AppMappingItem };
  name?: string;
  formContent?: { [key: string]: AppMappingItem };
}

export interface TemplateData {
  msc: {
    numsheets: number;
    currentid: string;
    currentname: string;
    sheetArr: {
      [sheetName: string]: {
        sheetstr: {
          savestr: string;
        };
        name: string;
        hidden: string;
      };
    };
    EditableCells: {
      allow: boolean;
      cells: {
        [cellName: string]: boolean;
      };
      constraints: {
        [cellName: string]: [string, string, string, string];
      };
    };
  };
  footers: { name: string; index: number; isActive: boolean }[];
  appMapping: {
    [sheetName: string]: {
      [header: string]: AppMappingItem;
    };
  };
}

export let DATA: { [key: number]: TemplateData } = `;

const finalContent = staticContent + jsonData + ";\n";

fs.writeFileSync(targetPath, finalContent);
console.log('templates.ts updated successfully.');
