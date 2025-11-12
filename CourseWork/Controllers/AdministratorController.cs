using CourseWork.DTOs;
using CourseWork.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Models;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Authorize(Roles = "Administrator")]
[ApiController]
[Route("administrator")]
public class AdministratorController : ControllerBase
{
    private readonly AdministratorService _adminService;

    public AdministratorController(AdministratorService adminService)
    {
        _adminService = adminService;
    }

    // -------------------- Dashboard --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        return Ok(new
        {
            Message = "Administrator dashboard is active",
            Sections = new[] { "users", "visits", "payments", "registration-requests", "statistics" }
        });
    }

    // -------------------- Admins & Users Management --------------------
    [HttpGet("admins")]
    public IActionResult GetAdmins()
    {
        var admins = _adminService.GetAllAdmins()
            .Select(UserMapper.ToDto)
            .ToList();
        return Ok(admins);
    }

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        var users = _adminService.GetAllUsers()
            .Select(UserMapper.ToDto)
            .ToList();
        return Ok(users);
    }

    [HttpDelete("users/{id}")]
    public IActionResult DeleteUser(string id)
    {
        return _adminService.DeleteUserById(id)
            ? Ok("User deleted successfully")
            : BadRequest("Failed to delete user");
    }

    // -------------------- Visits Management --------------------
    [HttpGet("visits")]
    public IActionResult GetVisits()
    {
        var visits = _adminService.GetAllVisits()
            .Select(VisitMapper.ToResponse)
            .ToList();
        return Ok(visits);
    }

    [HttpGet("visits/{id}")]
    public IActionResult GetVisitById(string id)
    {
        var visit = _adminService.GetVisitById(id);
        return visit != null ? Ok(VisitMapper.ToResponse(visit)) : NotFound("Visit not found");
    }

    [HttpPost("visits")]
    public IActionResult CreateVisit([FromBody] VisitRequestDto dto)
    {
        var visit = VisitMapper.ToVisit(dto, dto.PatientMedicalRecord, dto.SpecialistId);
        return _adminService.CreateVisit(visit)
            ? Ok("Visit created successfully")
            : BadRequest("Failed to create visit");
    }

    [HttpPut("visits/{id}")]
    public IActionResult UpdateVisit(string id, [FromBody] VisitUpdateDto dto)
    {
        var visit = _adminService.GetVisitById(id);
        if (visit == null) return NotFound("Visit not found");

        VisitMapper.ApplyUpdate(visit, dto);

        return _adminService.UpdateVisit(id, visit)
            ? Ok("Visit updated successfully")
            : BadRequest("Failed to update visit");
    }

    [HttpDelete("visits/{id}")]
    public IActionResult DeleteVisit(string id)
    {
        return _adminService.DeleteVisit(id)
            ? Ok("Visit deleted successfully")
            : BadRequest("Failed to delete visit");
    }

    [HttpGet("visits/total-cost")]
    public IActionResult GetTotalVisitCost([FromQuery] int recordNumber, [FromQuery] int year)
    {
        var total = _adminService.GetTotalVisitCostByYear(recordNumber, year);
        return Ok(new { RecordNumber = recordNumber, Year = year, TotalCost = total });
    }

    // -------------------- Payments Management --------------------
[HttpGet("payments")]
public IActionResult GetPayments()
{
    var payments = _adminService.GetAllPayments()
        .Select(PaymentMapper.ToDto)
        .ToList();
    return Ok(payments);
}

[HttpGet("payments/{id}")]
public IActionResult GetPaymentById(string id)
{
    var payment = _adminService.GetPaymentById(id);
    return payment != null ? Ok(PaymentMapper.ToDto(payment)) : NotFound("Payment not found");
}

[HttpPost("payments")]
public IActionResult CreatePayment([FromBody] PaymentDto dto)
{
    if (dto == null)
        return BadRequest("Payment data cannot be null.");
    
    if (!Enum.TryParse<PaymentStatus>(dto.Status, true, out var status))
    {
        status = PaymentStatus.Pending;
    }

    var payment = new Payment(
        dto.VisitId,
        dto.PatientMedicalRecord,
        dto.TotalAmount,
        dto.PaidAmount)
    {
        RemainingAmount = dto.RemainingAmount,
        Status = status,
        IssuedDate = dto.IssuedDate,
        DueDate = dto.DueDate
    };

    return _adminService.CreatePayment(payment)
        ? Ok("Payment created successfully")
        : BadRequest("Failed to create payment");
}

[HttpPut("payments/{id}")]
public IActionResult UpdatePayment(string id, [FromBody] PaymentDto dto)
{
    var existing = _adminService.GetPaymentById(id);
    if (existing == null)
        return NotFound("Payment not found");
    
    if (!Enum.TryParse<PaymentStatus>(dto.Status, true, out var status))
    {
        status = PaymentStatus.Pending;
    }

    // Оновлюємо всі релевантні поля
    existing.VisitId = dto.VisitId;
    existing.PatientMedicalRecord = dto.PatientMedicalRecord;
    existing.TotalAmount = dto.TotalAmount;
    existing.PaidAmount = dto.PaidAmount;
    existing.RemainingAmount = dto.RemainingAmount;
    existing.Status = status;
    existing.IssuedDate = dto.IssuedDate;
    existing.DueDate = dto.DueDate;

    return _adminService.UpdatePayment(id, existing)
        ? Ok("Payment updated successfully")
        : BadRequest("Failed to update payment");
}

[HttpDelete("payments/{id}")]
public IActionResult DeletePayment(string id)
{
    return _adminService.DeletePayment(id)
        ? Ok("Payment deleted successfully")
        : BadRequest("Failed to delete payment");
}

[HttpGet("payments/revenue")]
public IActionResult GetRevenueByPeriod([FromQuery] DateTime start, [FromQuery] DateTime end)
{
    var revenue = _adminService.GetClinicRevenueByPeriod(start, end);
    return Ok(new { StartDate = start, EndDate = end, TotalRevenue = revenue });
}

    // -------------------- Registration Requests --------------------
    [HttpGet("pending")]
    [Authorize(Roles = "Administrator")]
    public IActionResult GetPending() => Ok(_adminService.GetPendingRequests());
    
    [HttpPost("requests/{id}/approve")]
    public IActionResult ApproveRegistration(string id, [FromQuery] Role role = Role.Patient)
    {
        return _adminService.ApproveRegistration(id, role)
            ? Ok("Registration approved")
            : BadRequest("Failed to approve registration");
    }

    [HttpPost("requests/{id}/reject")]
    public IActionResult RejectRegistration(string id)
    {
        return _adminService.RejectRegistration(id)
            ? Ok("Registration rejected")
            : BadRequest("Failed to reject registration");
    }

    // -------------------- System Statistics --------------------
    [HttpGet("statistics")]
    public IActionResult GetStatistics([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var stats = _adminService.GetSystemStatistics(start, end);
        return Ok(new
        {
            stats.totalUsers,
            stats.totalVisits,
            stats.totalPayments,
            stats.totalRevenue
        });
    }
}