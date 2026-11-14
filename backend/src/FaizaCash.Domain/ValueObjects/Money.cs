namespace FaizaCash.Domain;
public static class Money
{
    public static bool IsValid(decimal amount) => amount > 0 && amount <= 9999999999999999.99m && decimal.Round(amount,2) == amount;
    public static decimal Signed(string type, decimal amount) => type switch { "income"=>amount,"expense"=>-amount,_=>throw new ArgumentException("Неизвестный тип операции") };
}
