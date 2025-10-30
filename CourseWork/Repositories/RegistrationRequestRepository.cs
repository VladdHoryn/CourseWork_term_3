namespace CourseWork.Repositories;

using CourseWork.Models;
using Сoursework.Repositories;
using MongoDB.Driver;

public class RegistrationRequestRepository
{
    private readonly IMongoCollection<RegistrationRequest> _collection;

    public RegistrationRequestRepository(MongoDBRepository db)
    {
        _collection = db.GetCollection<RegistrationRequest>("registration_requests");
    }

    public void CreateRequest(RegistrationRequest request)
    {
        _collection.InsertOne(request);
    }

    public List<RegistrationRequest> GetPendingRequests()
    {
        return _collection.Find(r => r.Status == RequestStatus.Pending).ToList();
    }

    public RegistrationRequest? GetRequestById(string id)
    {
        return _collection.Find(r => r.Id == id).FirstOrDefault();
    }

    public void UpdateStatus(string id, RequestStatus newStatus)
    {
        var filter = Builders<RegistrationRequest>.Filter.Eq(r => r.Id, id);
        var update = Builders<RegistrationRequest>.Update.Set(r => r.Status, newStatus);
        _collection.UpdateOne(filter, update);
    }

    public void DeleteRequest(string id)
    {
        _collection.DeleteOne(r => r.Id == id);
    }
}
