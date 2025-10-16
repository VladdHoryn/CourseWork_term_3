using MongoDB.Driver;
using Сoursework.Repositories;

namespace Сoursework.Models;

public class PaymentRepository
{
    private readonly IMongoCollection<Payment> _db_collection;

    public PaymentRepository(MongoDBRepository db)
    {
        _db_collection = db.GetCollection<Payment>("payments");
    }
    
    public List<Payment> GetAllPayments()
    {
        return _db_collection.Find(_ => true).ToList();
    }
    
    public void CreatePayment(Payment payment)
    {
        _db_collection.InsertOne(payment);
    }
    
    public Payment GetPaymentById(string id)
    {
        return _db_collection.Find(u => u.Id == id).FirstOrDefault();
    }
    
    public void UpdatePayment(string id, Payment payment)
    {
        var filter = Builders<Payment>.Filter.Eq(u => u.Id, id);
        var update = Builders<Payment>.Update.Set(u => u, payment);
        _db_collection.UpdateOne(filter, update);
    }
    
    public void DeletePayment(string id)
    {
        _db_collection.DeleteOne(u => u.Id == id);
    }

    // Task 3
    public decimal GetClinicRevenueByPeriod(DateTime startDate, DateTime endDate)
    {
        var filter = Builders<Payment>.Filter.And(
            Builders<Payment>.Filter.Gte(p => p.IssuedDate, startDate),
            Builders<Payment>.Filter.Lte(p => p.IssuedDate, endDate),
            Builders<Payment>.Filter.Ne(p => p.Status, PaymentStatus.Cancelled) // ігноруємо скасовані
        );

        var payments = _db_collection.Find(filter).ToList();

        return payments.Sum(p => p.PaidAmount);
    }

}