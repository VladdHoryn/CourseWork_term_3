using Сoursework.Models;
using Сoursework.Repositories;

namespace Сoursework.Services;

public class OperatorService : UserService
    {
        private readonly VisitService _visitService;
        private readonly PaymentService _paymentService;

        public OperatorService(
            UserRepository userRepo,
            VisitService visitService,
            PaymentService paymentService
        ) : base(userRepo)
        {
            _visitService = visitService;
            _paymentService = paymentService;
        }

        // ---------- User-related ----------
        public bool CreateUserByOperator(User newUser, string password)
        {
            return CreateUser(newUser, password);
        }

        public bool UpdateUserByOperator(User updated)
        {
            return UpdateUser(updated);
        }

        public bool DeleteUserByOperator(string id)
        {
            return DeleteUser(id);
        }

        public List<User> SearchUsers(Func<User, bool> predicate)
        {
            try
            {
                return GetAllUsers().Where(predicate).ToList();
            }
            catch
            {
                return new List<User>();
            }
        }

        // ---------- Visit-related ----------
        public List<Visit> GetAllVisitsByOperator()
        {
            return _visitService.GetAllVisits();
        }

        public Visit GetVisitByIdByOperator(string id)
        {
            return _visitService.GetVisitById(id);
        }

        public bool CreateVisitByOperator(Visit visit)
        {
            return _visitService.CreateVisit(visit);
        }

        public bool UpdateVisitByOperator(string id, Visit updatedVisit)
        {
            return _visitService.UpdateVisit(id, updatedVisit);
        }

        public bool DeleteVisitByOperator(string id)
        {
            return _visitService.DeleteVisit(id);
        }

        public List<Visit> SearchVisits(Func<Visit, bool> predicate)
        {
            try
            {
                return _visitService.GetAllVisits().Where(predicate).ToList();
            }
            catch
            {
                return new List<Visit>();
            }
        }

        // ---------- Payment-related ----------
        public List<Payment> GetAllPaymentsByOperator()
        {
            return _paymentService.GetAllPayments();
        }

        public Payment GetPaymentByIdByOperator(string id)
        {
            return _paymentService.GetPaymentById(id);
        }

        public bool CreatePaymentByOperator(Payment payment)
        {
            return _paymentService.CreatePayment(payment);
        }

        public bool UpdatePaymentByOperator(string id, Payment updated)
        {
            return _paymentService.UpdatePayment(id, updated);
        }

        public bool DeletePaymentByOperator(string id)
        {
            return _paymentService.DeletePayment(id);
        }

        public List<Payment> SearchPayments(Func<Payment, bool> predicate)
        {
            try
            {
                return _paymentService.GetAllPayments().Where(predicate).ToList();
            }
            catch
            {
                return new List<Payment>();
            }
        }
    }