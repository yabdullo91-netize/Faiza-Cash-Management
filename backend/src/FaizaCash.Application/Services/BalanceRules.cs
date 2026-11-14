using FaizaCash.Domain;
namespace FaizaCash.Application;
public static class BalanceRules
{
    public static bool CanPost(decimal opening, IEnumerable<PostingItem> ledger, PostingItem candidate)
    {
        foreach(var row in ledger.Append(candidate).OrderBy(x=>x.Date).ThenBy(x=>x.PostingSeq))
        {
            opening+=Money.Signed(row.Type,row.Amount);
            if(opening<0)return false;
        }
        return true;
    }
}
