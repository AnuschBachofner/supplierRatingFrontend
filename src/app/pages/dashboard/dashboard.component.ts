import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DefaultService, OrderDetailDTO, RatingDetailDTO, SupplierSummaryDTO } from '../../openapi-gen';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  OperatorFunction,
  Subject,
  switchMap,
} from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { RatingHistoryPoint } from './dashboard.types';
import {
  CHART_PRIMARY_BORDER_WIDTH,
  CHART_PRIMARY_POINT_RADIUS,
  CHART_SECONDARY_BORDER_WIDTH,
  CHART_SECONDARY_POINT_RADIUS,
  RATING_FORM_CONFIG,
} from '../../models/rating.config';
import { ChartConfiguration, ChartData } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { de } from 'date-fns/locale';
import { BaseChartDirective} from 'ng2-charts';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, NgbTypeahead, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  /**
   * Inject the supplier service, destroyRef and themeService for use in the component.
   */
  private supplierService = inject(DefaultService);
  private destroyRef = inject(DestroyRef);
  private themeService = inject(ThemeService);

  /**
   * Signal for the suppliers
   */
  readonly suppliers = signal<SupplierSummaryDTO[]>([]);

  /**
   * Signal for the selected supplier
   */
  readonly selectedSupplier = signal<SupplierSummaryDTO | null>(null);

  /**
   * Computed signal for the selected supplier ID
   */
  readonly selectedSupplierId = computed(() => this.selectedSupplier()?.id ?? null);

  /**
   * Signal for the rating history
   */
  readonly historyPoints = signal<RatingHistoryPoint[]>([]);

  /**
   * Signal for the loading state of the history
   */
  readonly isLoadingHistory = signal(false);

  /**
   * Subject for the focus event
   */
  readonly focus$ = new Subject<string>();

  /**
   * Subject for the click event
   */
  readonly click$ = new Subject<string>();

  /**
   * Signal for the error message
   */
  readonly errorMessage = signal<string | null>(null);

  /**
   * The fields to be displayed in the rating history chart, extracted from the form configuration.
   * Only fields that have a defined color are included, as those are the ones meant to be shown in the chart.
   * This is derived from the RATING_FORM_CONFIG which defines the structure of the rating form and its fields.
   */
  private readonly chartSeries = RATING_FORM_CONFIG.flatMap(section => section.fields).filter(
    field => field.color !== undefined
  );

  /**
   * Computed signal for the chart data, which is derived from the history points and the chart series.
   * The chart data is an object that can be used by Chart.js to render a line chart.
   * The data is grouped by the date of each point and each point is represented as a point on the chart.
   * The color of each point is determined by the color of the corresponding field in the chart series.
   * The border width of each point is determined by whether it is the primary field or not.
   * The point radius and hover radius of each point are also determined by whether it is the primary field or not.
   * The data is sorted by date in ascending order.
   */
  readonly chartData = computed<ChartData<'line', { x: Date; y: number }[]>>(() => {
    const points = this.historyPoints();
    return {
      datasets: this.chartSeries.map(field => ({
        label: field.label,
        data: points
          .filter(p => p[field.key as keyof RatingHistoryPoint] !== null)
          .map(p => ({ x: p.date, y: p[field.key as keyof RatingHistoryPoint] as number })),
        borderColor: field.color,
        backgroundColor: field.color,
        borderWidth: field.isPrimary ? CHART_PRIMARY_BORDER_WIDTH : CHART_SECONDARY_BORDER_WIDTH,
        tension: 0.2,
        pointRadius: field.isPrimary ? CHART_PRIMARY_POINT_RADIUS : CHART_SECONDARY_POINT_RADIUS,
        pointHoverRadius: field.isPrimary ? CHART_PRIMARY_POINT_RADIUS + 2 : CHART_SECONDARY_POINT_RADIUS + 2,
      })),
    };
  });

  /**
   * Chart configuration: time-based x-axis with quarters, fixed y-axis 1-5,
   * tooltip with full date.
   */
  readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => {
    const isDark = this.themeService.currentTheme() === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.75)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: {
          type: 'time',
          bounds: 'ticks',
          time: {
            unit: 'quarter',
            displayFormats: { quarter: 'QQQ yyyy' },
            tooltipFormat: 'dd.MM.yyyy',
          },
          adapters: { date: { locale: de } },
          ticks: { color: textColor },
          grid: { color: gridColor },
          title: { display: true, text: 'Zeitraum', color: textColor },
        },
        y: {
          min: 1,
          max: 5.2,
          ticks: {
            stepSize: 1,
            color: textColor,
            callback: value => {
              const num = Number(value);
              return Number.isInteger(num) && num >= 1 && num <= 5 ? num : '';
            },
          },
          grid: { color: gridColor },
          title: { display: true, text: 'Bewertung (1–5)', color: textColor },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor },
        },
        tooltip: {
          callbacks: {
            title: items => {
              const raw = items[0].raw as { x: Date };
              return new Date(raw.x).toLocaleDateString('de-CH', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });
            },
          },
        },
      },
    };
  });

  constructor() {
    effect(() => {
      const supplierId = this.selectedSupplierId();
      if (supplierId) {
        this.loadRatingHistory(supplierId);
      } else {
        this.historyPoints.set([]);
      }
    });
  }

  /**
   * Lifecycle hook that is called after the component is initialized.
   */
  ngOnInit(): void {
    this.loadSuppliers();
  }

  /**
   * Loads suppliers from the service and updates the suppliers signal.
   * If an error occurs, it sets the error message.
   * @returns void
   */
  private loadSuppliers(): void {
    this.errorMessage.set(null);
    this.supplierService
      .getAllSuppliers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => this.suppliers.set(data),
        error: () => this.errorMessage.set('Lieferanten konnten nicht geladen werden.'),
      });
  }

  /**
   * Loads rating history for the selected supplier.
   * @param supplierId The ID of the supplier to load history for.
   * @returns void
   */
  private loadRatingHistory(supplierId: string): void {
    this.isLoadingHistory.set(true);
    this.errorMessage.set(null);

    this.supplierService
      .getOrders(supplierId)
      .pipe(
        switchMap((orders: OrderDetailDTO[]) => {
          const ratedOrders = orders.filter(o => o.ratingId);
          if (ratedOrders.length === 0) {
            return of({ orders: ratedOrders, ratings: [] as RatingDetailDTO[] });
          }
          const ratingCalls = ratedOrders.map(o => this.supplierService.getRatingById(o.ratingId!));
          return forkJoin(ratingCalls).pipe(map(ratings => ({ orders: ratedOrders, ratings })));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ orders, ratings }) => {
          const points = this.buildHistoryPoints(orders, ratings);
          this.historyPoints.set(points);
          this.isLoadingHistory.set(false);
        },
        error: () => {
          this.errorMessage.set('Bewertungsverlauf konnte nicht geladen werden.');
          this.isLoadingHistory.set(false);
        },
      });
  }

  /**
   * Builds the history points for the rating history chart.
   * @param orders The list of orders.
   * @param ratings The list of ratings.
   * @returns An array of RatingHistoryPoint objects.
   */
  private buildHistoryPoints(orders: OrderDetailDTO[], ratings: RatingDetailDTO[]): RatingHistoryPoint[] {
    const ratingsById = new Map(ratings.map(r => [r.id, r]));

    return orders
      .map(order => {
        const rating = order.ratingId ? ratingsById.get(order.ratingId) : null;
        if (!rating) return null;
        return {
          date: new Date(order.orderDate),
          totalScore: rating.totalScore,
          quality: rating.quality,
          cost: rating.cost,
          reliability: rating.reliability,
          availability: rating.availability ?? null,
          orderName: order.name,
        } satisfies RatingHistoryPoint;
      })
      .filter((p): p is RatingHistoryPoint => p !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Operator function for filtering suppliers based on the search term.
   * @param text$ The observable of search text.
   * @returns An observable of filtered suppliers.
   */
  search: OperatorFunction<string, readonly SupplierSummaryDTO[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const inputs$ = merge(debouncedText$, this.focus$, this.click$);

    return inputs$.pipe(
      map(term =>
        term.length < 1
          ? this.suppliers()
          : this.suppliers()
              .filter(s => s.name.toLowerCase().includes(term.toLowerCase()))
              .slice(0, 10)
      )
    );
  };

  /**
   * Formatter function for displaying supplier names in the dropdown.
   * @param supplier The supplier to format.
   * @returns The formatted supplier name.
   */
  formatter = (supplier: SupplierSummaryDTO): string => supplier.name;

  /**
   * Handles the selection of a supplier from the dropdown.
   * @param value The selected supplier or null if no supplier is selected.
   */
  onSupplierSelected(value: SupplierSummaryDTO | string | null): void {
    if (value && typeof value !== 'string') {
      this.selectedSupplier.set(value);
    } else if (value === null || value === '') {
      this.selectedSupplier.set(null);
    }
  }
}
