using MongoDB.Bson;

namespace CourseWork.Helpers;

public static class BsonJsonConverter
{
    public static object ToPlainObject(BsonValue value)
    {
        if (value == null || value.IsBsonNull) return null;

        switch (value.BsonType)
        {
            case BsonType.ObjectId:
                return value.AsObjectId.ToString();

            case BsonType.String:
                return value.AsString;

            case BsonType.Int32:
                return value.AsInt32;

            case BsonType.Int64:
                return value.AsInt64;

            case BsonType.Double:
                return value.AsDouble;

            case BsonType.Boolean:
                return value.AsBoolean;

            case BsonType.DateTime:
                return value.ToUniversalTime(); // конвертуємо у DateTime

            case BsonType.Document:
                var doc = value.AsBsonDocument;
                return doc.Elements.ToDictionary(e => e.Name, e => ToPlainObject(e.Value));

            case BsonType.Array:
                var arr = value.AsBsonArray;
                return arr.Select(ToPlainObject).ToList();

            default:
                return value.ToString();
        }
    }

    public static List<object> ConvertList(IEnumerable<BsonDocument> docs)
    {
        return docs.Select(d => ToPlainObject(d)).ToList();
    }
}