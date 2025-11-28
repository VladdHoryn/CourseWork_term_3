using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace Сoursework.Repositories;

public class SqlToMongoExecutor
{
    private readonly IMongoDatabase _db;

    public SqlToMongoExecutor(IMongoDatabase database)
    {
        _db = database;
    }

    public async Task<List<BsonDocument>> ExecuteAsync(string sql)
    {
        sql = sql.Trim();

        // ============================
        // 1. Витягнути SELECT поля
        // ============================
        var selectMatch = Regex.Match(sql, @"select\s+(.+?)\s+from", RegexOptions.IgnoreCase);
        if (!selectMatch.Success)
            throw new Exception("Invalid SQL: missing SELECT");

        string selectPart = selectMatch.Groups[1].Value.Trim();


        // ============================
        // 2. Витягнути назву колекції
        // ============================
        var fromMatch = Regex.Match(sql, @"from\s+(\w+)", RegexOptions.IgnoreCase);
        if (!fromMatch.Success)
            throw new Exception("Invalid SQL: missing FROM");

        string collectionName = fromMatch.Groups[1].Value;


        var collection = _db.GetCollection<BsonDocument>(collectionName);

        // ============================
        // 3. WHERE умова
        // ============================
        FilterDefinition<BsonDocument> filter = Builders<BsonDocument>.Filter.Empty;

        var whereMatch = Regex.Match(sql, @"where\s+(.+)", RegexOptions.IgnoreCase);
        if (whereMatch.Success)
        {
            string condition = whereMatch.Groups[1].Value.Trim();
            filter = BuildFilter(condition);
        }

        // ============================
        // 4. Вибрані поля проєкції
        // ============================
        ProjectionDefinition<BsonDocument> projection = null;

        if (selectPart != "*")
        {
            var fields = selectPart.Split(',')
                                   .Select(f => f.Trim())
                                   .ToList();

            var builder = Builders<BsonDocument>.Projection;
            var proj = builder.Include(fields[0]);
            for (int i = 1; i < fields.Count; i++)
                proj = proj.Include(fields[i]);

            projection = proj.Exclude("_id");
        }

        // ============================
        // 5. Виконати запит
        // ============================
        var find = collection.Find(filter);

        if (projection != null)
            find = find.Project(projection);

        return await find.ToListAsync();
    }



    // =====================================
    // ПАРСЕР WHERE: field = 'x', >, <, !=
    // =====================================
    private FilterDefinition<BsonDocument> BuildFilter(string cond)
    {
        // field = 'text'
        var eqStr = Regex.Match(cond, @"(\w+)\s*=\s*'([^']+)'");
        if (eqStr.Success)
        {
            string field = eqStr.Groups[1].Value;
            string val = eqStr.Groups[2].Value;
            return Builders<BsonDocument>.Filter.Eq(field, val);
        }

        // field = 123
        var eqNum = Regex.Match(cond, @"(\w+)\s*=\s*(\d+)");
        if (eqNum.Success)
        {
            string field = eqNum.Groups[1].Value;
            int val = int.Parse(eqNum.Groups[2].Value);
            return Builders<BsonDocument>.Filter.Eq(field, val);
        }

        // field > number
        var gt = Regex.Match(cond, @"(\w+)\s*>\s*(\d+)");
        if (gt.Success)
        {
            return Builders<BsonDocument>.Filter.Gt(gt.Groups[1].Value, int.Parse(gt.Groups[2].Value));
        }

        // field < number
        var lt = Regex.Match(cond, @"(\w+)\s*<\s*(\d+)");
        if (lt.Success)
        {
            return Builders<BsonDocument>.Filter.Lt(lt.Groups[1].Value, int.Parse(lt.Groups[2].Value));
        }

        // field != 'value'
        var neq = Regex.Match(cond, @"(\w+)\s*!=\s*'([^']+)'");
        if (neq.Success)
        {
            return Builders<BsonDocument>.Filter.Ne(neq.Groups[1].Value, neq.Groups[2].Value);
        }

        throw new Exception("Unsupported WHERE condition: " + cond);
    }
}