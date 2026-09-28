namespace Persistence;

using System;
using System.Collections.Generic;
using System.IO;

using Core.Contracts;

using System.Threading.Tasks;
using System.Linq;

using Base.Tools.CsvImport;

using Core.Entities;

using Persistence.Import;

public class ImportService : IImportService
{
    private IUnitOfWork _uow;

    public ImportService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    private static string GetFullPathName(string filename)
    {
        return Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, filename));
    }

    public async Task ImportDbAsync()
    {
        var demosCsv = await new CsvImport<MDemoCsv>().ReadAsync(GetFullPathName("Import/MDemo.csv"));

        var fMemos = demosCsv
            .Select(d => d.FName)
            .Distinct()
            .Select(fn => new FDemo { Name = fn })
            .ToDictionary(f => f.Name, f => f);

        var mDemos = demosCsv
            .Select(d => new MDemo
            {
                Name  = d.Name,
                FDemo = fMemos[d.FName],
                DDemos = d.DNames
                            .Split(',',StringSplitOptions.RemoveEmptyEntries)
                            .Select(dn => new DDemo { Name = dn.Trim() })
                            .ToList()
            })
            .ToList();

        await _uow.MDemoRepository.AddRangeAsync(mDemos);
        await _uow.SaveChangesAsync();
    }
}