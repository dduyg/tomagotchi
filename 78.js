{
  const container = html`<div></div>`;

  function render() {
    container.innerHTML = "";

    filteredTables.forEach((table, tIndex) => {
      const tableDiv = html`
        <div style="
          background: #f8f8ff;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 32px;
          overflow: hidden;
          color: #222;
          font-family: 'JetBrains Mono', monospace;
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, #fff 0%, #f4f4ff 100%);
            padding: 20px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: end;
            justify-content: space-between;
          ">
            <div style="flex: 1 1 220px; display: flex; flex-direction: column;">
              <label style="font-size: 10px; text-transform: uppercase; color: #0abdc6; letter-spacing: 0.5px; margin-bottom: 4px;">Source System</label>
              <input type="text" value="${
                table.sourceSystem
              }" placeholder="e.g., CRM_PROD"
                data-table="${tIndex}" data-field="sourceSystem"
                style="padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1);
                background: rgba(255,255,255,0.9); color: #111; font-size: 14px;"/>
            </div>

            <div style="flex: 1 1 220px; display: flex; flex-direction: column;">
              <label style="font-size: 10px; text-transform: uppercase; color: #ff00aa; letter-spacing: 0.5px; margin-bottom: 4px;">Schema Name</label>
              <input type="text" value="${
                table.schemaName
              }" placeholder="e.g., sales"
                data-table="${tIndex}" data-field="schemaName"
                style="padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1);
                background: rgba(255,255,255,0.9); color: #111; font-size: 14px;"/>
            </div>

            <div style="flex: 1 1 220px; display: flex; flex-direction: column;">
              <label style="font-size: 10px; text-transform: uppercase; color: #7200ff; letter-spacing: 0.5px; margin-bottom: 4px;">Table Name</label>
              <input type="text" value="${
                table.tableName
              }" placeholder="e.g., customer"
                data-table="${tIndex}" data-field="tableName"
                style="padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1);
                background: rgba(255,255,255,0.9); color: #111; font-size: 14px;"/>
            </div>

            <button data-action="deleteTable" data-table="${tIndex}"
              style="padding: 10px; height: 42px; width: 42px;
              background: rgba(0,0,0,0.05);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 18px;
              transition: 0.2s all;
              flex-shrink: 0;">🗑️</button>
          </div>

          <!-- Body -->
          <div style="padding: 28px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h3 style="margin: 0; font-size: 14px; color: #7200ff; text-transform: uppercase; letter-spacing: 1px;">
                Fields <span style="color: #888; font-weight: 400;">(${
                  table.fields.length
                })</span>
              </h3>
              <button data-action="addField" data-table="${tIndex}"
                style="padding: 8px 16px; background: linear-gradient(135deg, #ff0080, #0abdc6);
                color: #fff;
                border: none;
                border-radius: 8px; cursor: pointer; font-size: 13px;">➕ Add Field</button>
            </div>

            ${
              table.fields.length === 0
                ? `<div style="text-align: center; padding: 40px; color: #666; background: rgba(255,255,255,0.6); border: 1px dashed rgba(0,0,0,0.15); border-radius: 8px;">
                   No fields defined. Click "Add Field" to get started.
                 </div>`
                : `<div style="overflow-x: auto; border: 1px solid rgba(0,0,0,0.1);">
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                      <tr>
                        ${[
                          "Field Name",
                          "Data Type",
                          "Length",
                          "Nullable",
                          "PK",
                          "FK",
                          "Default",
                          "Description",
                          "Business Rule",
                          "Sample Values",
                          "Transformation",
                          "Actions"
                        ]
                          .map(
                            (h) =>
                              `<th style="padding: 5px 10px; text-align: left; color: #0abdc6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px;">${h}</th>`
                          )
                          .join("")}
                      </tr>
                    </thead>
                    <tbody>
                      ${table.fields
                        .map(
                          (field, fIndex) => `
                        <tr style="transition: 0.2s;">
                          <td style="padding: 8px 10px;"><input data-field="fieldName" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.fieldName}" placeholder="field_name"
                            style="width: 150px; margin-right: 12px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="dataType" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.dataType}" placeholder="VARCHAR"
                            style="width: 100px; margin-left: 6px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="length" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.length}" placeholder="255"
                            style="width: 60px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="nullable" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.nullable}"
                            style="width: 60px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="primaryKey" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.primaryKey}"
                            style="width: 60px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="foreignKey" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.foreignKey}" placeholder="table.field"
                            style="width: 120px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="defaultValue" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.defaultValue}" placeholder="NULL"
                            style="width: 80px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="description" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.description}"
                            style="width: 180px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="businessRule" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.businessRule}"
                            style="width: 180px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="sampleValues" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.sampleValues}"
                            style="width: 140px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><input data-field="transformationLogic" data-table="${tIndex}" data-field-index="${fIndex}" value="${field.transformationLogic}"
                            style="width: 180px; background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.1); color: #111; border-radius: 5px; padding: 5px 8px;"/></td>
                          <td style="padding: 8px 10px;"><button data-action="deleteField" data-table="${tIndex}" data-field-index="${fIndex}" style="background:none; border:none; color:#ff00aa; cursor:pointer;">🗑️</button></td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
            }
          </div>
        </div>`;

      container.appendChild(tableDiv);
    });

    // --- EVENTS ---

    // Update inputs
    container.querySelectorAll("[data-field]").forEach((el) => {
      const tIdx = +el.dataset.table;
      const key = el.dataset.field;
      el.addEventListener("input", (e) => {
        const newTables = [...tables];
        newTables[tIdx][key] = e.target.value;
        mutable tables = newTables;
      });
    });

    // Add field
    container.querySelectorAll('[data-action="addField"]').forEach((btn) => {
      const tIdx = +btn.dataset.table;
      btn.addEventListener("click", () => {
        const newTables = [...tables];
        newTables[tIdx].fields.push({
          id: Date.now(),
          fieldName: "",
          dataType: "",
          length: "",
          nullable: "YES",
          primaryKey: "NO",
          foreignKey: "",
          defaultValue: "",
          description: "",
          businessRule: "",
          sampleValues: "",
          transformationLogic: ""
        });
        mutable tables = newTables;
      });
    });

    // Delete field
    container.querySelectorAll('[data-action="deleteField"]').forEach((btn) => {
      const tIdx = +btn.dataset.table;
      const fIdx = +btn.dataset.fieldIndex;
      btn.addEventListener("click", () => {
        const newTables = [...tables];
        newTables[tIdx].fields.splice(fIdx, 1);
        mutable tables = newTables;
      });
    });

    // ✅ Delete table (the real fix)
    container.querySelectorAll('[data-action="deleteTable"]').forEach((btn) => {
      const tIdx = +btn.dataset.table;
      btn.addEventListener("click", () => {
        if (confirm("Delete this table?")) {
          mutable tables = tables.filter((_, i) => i !== tIdx);
        }
      });
    });
  }

  render();
  return container;
}
