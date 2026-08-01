const { getPool, sql } = require("../../config/db");

const editableColumns = [
    ["SkelpNo", sql.NVarChar(200)],
    ["SlitFormNo", sql.NVarChar(100)],
    ["Date", sql.DateTime2],
    ["ProdFormNo", sql.NVarChar(100)],
    ["HSPrime", sql.NVarChar(100)],
    ["Thickness", sql.Float],
    ["Width", sql.Float],
    ["Weight", sql.Float],
    ["WeightBefProc", sql.Float],
    ["FGtoProduce", sql.NVarChar(200)],
    ["LengthofFg", sql.Float],
    ["Remarks", sql.NVarChar(1000)],
    ["Status", sql.NVarChar(100)],
    ["DateProcessed", sql.DateTime2],
    ["Operator", sql.NVarChar(200)],
    ["OtherRemarks", sql.NVarChar(200)],
    ["Location", sql.NVarChar(200)],
];

const addInputs = (request, item) => {
    editableColumns.forEach(([name, type]) => request.input(name, type, item[name]));
    return request;
};

const list = async () => {
    const result = await getPool().request().query(
        "SELECT * FROM Skelps ORDER BY [Date] DESC, Id DESC"
    );
    return result.recordset;
};

const findById = async (id) => {
    const result = await getPool().request()
        .input("Id", sql.BigInt, id)
        .query("SELECT * FROM Skelps WHERE Id = @Id");
    return result.recordset[0];
};

const insertQuery = `
    INSERT INTO Skelps (
        SkelpNo, SlitFormNo, [Date], ProdFormNo, HSPrime, Thickness, Width,
        [Weight], WeightBefProc, FGtoProduce, LengthofFg, Remarks, [Status],
        DateProcessed, Operator, OtherRemarks, [Location]
    )
    OUTPUT INSERTED.*
    VALUES (
        @SkelpNo, @SlitFormNo, @Date, @ProdFormNo, @HSPrime, @Thickness, @Width,
        @Weight, @WeightBefProc, @FGtoProduce, @LengthofFg, @Remarks, @Status,
        @DateProcessed, @Operator, @OtherRemarks, @Location
    )`;

const create = async (item) => {
    const result = await addInputs(getPool().request(), item).query(insertQuery);
    return result.recordset[0];
};

const createMany = async (items) => {
    const transaction = new sql.Transaction(getPool());
    await transaction.begin();
    try {
        for (const item of items) {
            await addInputs(new sql.Request(transaction), item).query(insertQuery);
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const update = async (id, item) => {
    const request = addInputs(getPool().request(), item).input("Id", sql.BigInt, id);
    const result = await request.query(`
        UPDATE Skelps SET
            SkelpNo=@SkelpNo, SlitFormNo=@SlitFormNo, [Date]=@Date,
            ProdFormNo=@ProdFormNo, HSPrime=@HSPrime, Thickness=@Thickness,
            Width=@Width, [Weight]=@Weight, WeightBefProc=@WeightBefProc,
            FGtoProduce=@FGtoProduce, LengthofFg=@LengthofFg, Remarks=@Remarks,
            [Status]=@Status, DateProcessed=@DateProcessed, Operator=@Operator,
            OtherRemarks=@OtherRemarks, [Location]=@Location,
            UpdatedAt=GETDATE()
        OUTPUT INSERTED.*
        WHERE Id=@Id`);
    return result.recordset[0];
};

const remove = async (id) => {
    const result = await getPool().request()
        .input("Id", sql.BigInt, id)
        .query("DELETE FROM Skelps OUTPUT DELETED.Id WHERE Id = @Id");
    return result.recordset[0];
};

module.exports = { list, findById, create, createMany, update, remove };
