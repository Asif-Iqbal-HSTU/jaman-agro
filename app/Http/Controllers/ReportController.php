<?php

namespace App\Http\Controllers;

use App\Services\AnnualReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * The year month by month, for the owner.
     */
    public function __invoke(Request $request): Response
    {
        $years = AnnualReport::years();

        $request->validate(['year' => ['nullable', 'integer', 'min:2000', 'max:2100']]);
        $year = $request->integer('year') ?: $years[0];

        return Inertia::render('reports/index', [
            'report' => AnnualReport::for($year),
            'years' => $years,
        ]);
    }
}
