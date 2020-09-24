import { GoogleSpreadsheet } from "google-spreadsheet";

export const GS = {
  doc: null,

  init() {
    this.doc = new GoogleSpreadsheet(process.env.VUE_APP_SHEET_ID);

    // Use API key -- only for read-only access to public sheets
    this.doc.useApiKey(process.env.VUE_APP_API_KEY);
  },

  async getSheetRows() {
    await this.doc.loadInfo(); // loads document properties and worksheets
    return await this.doc.sheetsByIndex[0].getRows(); // or use doc.sheetsById[id]
  }
};
