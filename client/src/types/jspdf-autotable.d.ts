declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf";

  interface UserOptions {
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    startY?: number;
    margin?: any;
    theme?: string;
    headStyles?: any;
    footStyles?: any;
    bodyStyles?: any;
    html?: string | HTMLElement;
    includeHiddenHtml?: boolean;
  }

  function autoTable(doc: jsPDF, options: UserOptions): void;
  export default autoTable;
}
