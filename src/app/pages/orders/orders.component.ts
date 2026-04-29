import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ListSearch } from '../../components/list-search/list-search';
import { AddBtn } from '../../components/add-btn/add-btn';
import { LucideAngularModule, NotepadText } from 'lucide-angular';
import { NgbModal, NgbModalOptions, NgbOffcanvas, NgbOffcanvasOptions } from '@ng-bootstrap/ng-bootstrap';
import { ToastComponent } from '../../components/toast/toast.component';
import { ListItem } from '../../components/list-item/list-item';
import { ModalEditOrderComponent, OrderEditResult } from '../../components/modal-edit-order/modal-edit-order';
import { PanelFormOrderComponent } from '../../components/panel-form-order/panel-form-order';
import { DefaultService, OrderCreateDTO, OrderDetailDTO, OrderUpdateDTO, RatingCreateDTO } from '../../openapi-gen';
import { ModalRatingComponent } from '../../components/modal-rating/modal-rating';
import { ModalAddOrderComponent, OrderAddResult } from '../../components/modal-add-order/modal-add-order';
import { ListItemHeadersComponent } from '../../components/list-item-headers/list-item-headers.component';

@Component({
  selector: 'app-orders',
  imports: [ListSearch, AddBtn, ListItem, ToastComponent, LucideAngularModule, ListItemHeadersComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit {
  /**
   * Lucide Icon
   * @protected
   */
  protected readonly NotepadText = NotepadText;

  /**
   * Injected NgbModal as our modal service
   * @private
   */
  private modalService = inject(NgbModal);

  /**
   * Modal Options
   * @private
   */
  private readonly modalOptions: NgbModalOptions = {
    animation: true,
    size: 'lg',
    fullscreen: 'md',
    centered: true,
    backdrop: 'static',
    scrollable: true,
  };

  /**
   * Injected NgbOffcanvas as our offcanvas service
   * @private
   */
  private offCanvasService = inject(NgbOffcanvas);

  /**
   * Offcanvas Options
   * @private
   */
  private readonly offCanvasOptions: NgbOffcanvasOptions = {
    animation: true,
    panelClass: 'w-xs-100 w-sm-100 w-md-50',
    position: 'end',
    backdrop: true,
    scroll: true,
  };

  /**
   * Injected OrderService, ratingService and DestroyRef
   * @private
   */
  private orderService: DefaultService = inject(DefaultService);
  private ratingService = inject(DefaultService);
  private destroyRef = inject(DestroyRef);

  /**
   * State: List of all orders
   */
  readonly orders = signal<OrderDetailDTO[]>([]);

  /**
   * State: Selected order ID
   */
  readonly selectedOrderId = signal<string | null>(null);

  /**
   * State: The actual search term for filtering list-items
   */
  readonly searchTerm = signal<string>('');

  /**
   * State: Error message for UI to display
   */
  readonly errorMessage = signal<string | null>(null);

  /**
   * State: Success message for UI to display (grün)
   */
  readonly successMessage = signal<string | null>(null);

  /**
   * Lifecycle hook that is called after the component is initialized.
   */
  ngOnInit() {
    this.loadOrders();
  }

  /**
   * Loads order-data from the service and updates the signal state
   * If an error occurs, an error message should be displayed.
   */
  private loadOrders() {
    this.errorMessage.set(null);
    this.orderService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.orders.set(data);
          console.log('Bestellungen geladen:', data);
        },
        error: () => {
          this.errorMessage.set(
            'Laden der Bestellungen fehlgeschlagen. Bitte überprüfe deine Verbindung und versuche erneut.'
          );
        },
      });
  }

  /**
   * Closes the Toast error message
   * @protected
   */
  protected closeToast() {
    this.errorMessage.set(null);
  }

  /**
   * Closes the success toast message
   * @protected
   */
  protected closeSuccessToast() {
    this.successMessage.set(null);
  }

  /**
   * Opens the detail panel for a specific order, passing the order data to it and checking for an associated rating.
   * @param detailedOrder
   */
  openDetailPanel(detailedOrder: OrderDetailDTO) {
    this.errorMessage.set(null);
    // Set selected order ID (for changing active state of list-item)
    this.selectedOrderId.set(detailedOrder.id);
    // open offcanvas panel
    const panelInstance = this.offCanvasService.open(PanelFormOrderComponent, this.offCanvasOptions);
    // transfer the order data to the panel
    panelInstance.componentInstance.order.set(detailedOrder);
    // If the order has a rating, load it and pass it to the panel
    if (detailedOrder.ratingId) {
      this.loadRatingForPanel(detailedOrder.ratingId, panelInstance.componentInstance);
    }
  }

  /**
   * loads the rating for the given panel and passes it to the panel instance
   * @param ratingId
   * @param panelInstance
   * @private
   */
  private loadRatingForPanel(ratingId: string, panelInstance: PanelFormOrderComponent) {
    this.ratingService
      .getRatingById(ratingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ratingData => {
          // Rating an das Panel übergeben
          panelInstance.rating.set(ratingData);
        },
        error: () => {
          // Wenn Rating laden fehlschlägt, ist das nicht kritisch, wir zeigen einfach keins an.
          console.error('Rating konnte nicht geladen werden');
        },
      });
  }

  /**
   * Opens Modal for adding or editing an order
   */
  openAddOrderModal() {
    const modalRef = this.modalService.open(ModalAddOrderComponent, this.modalOptions);
    modalRef.result.then(
      (result: OrderAddResult) => {
        this.createAndAddOrder(result.data);
      },
      () => {
        /* dismissed */
      }
    );
  }

  /**
   * Creates a new order and adds it to the list view
   * @param orderCreate
   * @private
   */
  private createAndAddOrder(orderCreate: Partial<OrderDetailDTO>) {
    const newOrder: OrderCreateDTO = {
      ...orderCreate,
    } as OrderCreateDTO;
    console.log('Sende Create-Order:', newOrder);

    this.orderService
      .createOrder(newOrder)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // load whole list new to see the new order
          this.loadOrders();
          // Show success message
          this.successMessage.set(`Bestellung "${orderCreate.name}" wurde erfolgreich erstellt.`);
        },
        error: err => {
          console.error('Fehler beim Erstellen:', err); // Zeigt dir den genauen Fehler im Browser
          this.errorMessage.set('Fehler beim Erstellen der Bestellung. Bitte prüfen Sie die Eingaben.');
        },
      });
  }

  /**
   * Opens the modal in edit mode for an existing order
   * @param detailedOrder The order to edit
   */
  openEditOrderModal(detailedOrder: OrderDetailDTO) {
    const modalRef = this.modalService.open(ModalEditOrderComponent, this.modalOptions);

    // Das detailedOrder an das Modal übergeben
    console.log('Öffne Edit Modal für Bestellung:', detailedOrder);
    modalRef.componentInstance.order.set(detailedOrder);

    // 5. Ergebnis verarbeiten (wie bisher)
    modalRef.result.then(
      (result: OrderEditResult) => {
        const updateData = result.data;

        if (result.action === 'SAVE') {
          this.updateExistingOrder(detailedOrder.id, updateData);
        } else if (result.action === 'RATE') {
          this.openRatingModal(detailedOrder.id, updateData);
        }
      },
      () => {
        /* Modal abgebrochen */
      }
    );
  }

  /**
   * Updates an existing order and refreshes the local state
   * @param id The stable identifier
   * @param formData The updated data from the form
   * @private
   */
  private updateExistingOrder(id: string, formData: Partial<OrderDetailDTO>) {
    const existingOrder = this.orders().find(o => o.id === id);

    const updatedOrder: OrderUpdateDTO = {
      ...existingOrder,
      ...formData,
    } as OrderUpdateDTO;
    this.orderService
      .updateOrder(id, updatedOrder)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // load whole list new to see the edited order
          this.loadOrders();
        },
        error: () => this.errorMessage.set('Fehler beim Aktualisieren.'),
      });
  }

  /**
   * Opens the rating modal for a specific order, opens by clicking on the button to rate when user wants to rate an order
   * @param id
   * @param orderData
   * @private
   */
  private openRatingModal(id: string, orderData: Partial<OrderDetailDTO>) {
    const modalRef = this.modalService.open(ModalRatingComponent, this.modalOptions);

    // Wir übergeben die Order-Daten an das Rating-Modal
    modalRef.componentInstance.order.set(orderData);

    modalRef.result.then(
      (ratingResult: RatingCreateDTO) => {
        if (!ratingResult) return;
        this.createRatingForOrder(id, ratingResult);
      },
      () => {
        /* dismissed */
      }
    );
  }

  /**
   * Creates a rating for a specific order
   * @param orderId
   * @param ratingData
   * @private
   */
  private createRatingForOrder(orderId: string, ratingData: RatingCreateDTO) {
    // Wir setzen die orderId explizit, falls sie im Formular fehlte
    const payload: RatingCreateDTO = { ...ratingData, orderId };

    // Achtung: Wenn DefaultService kein 'createRating' hat, prüfen ob es einen RatingService gibt.
    // Falls DefaultService alle Methoden generiert hat, ist das hier korrekt:
    this.orderService
      .createRating(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Liste neu laden, damit der Status "RATED" sichtbar wird
          this.loadOrders();
        },
        error: () => this.errorMessage.set('Bestellung gespeichert, aber Bewertung fehlgeschlagen.'),
      });
  }

  /**
   * Filters the list of orders based on the current search term and sorts it by rating status and order date.
   * @description Computed Signal: Automatically recalculates the list, if the search term OR the list changes.
   */
  readonly filteredOrders = computed(() => {
    const list = this.orders();
    const term = this.searchTerm().toLowerCase();

    // filter list items based on search term - if term is empty, show all (filtered = list)
    const filtered = term
      ? list.filter(
        order =>
          (order.name || '').toLowerCase().includes(term) ||
          (order.mainCategory || '').toLowerCase().includes(term) ||
          (order.subCategory || '').toLowerCase().includes(term) ||
          (order.details || '').toLowerCase().includes(term) ||
          (order.contactPerson || '').toLowerCase().includes(term) ||
          (order.contactEmail || '').toLowerCase().includes(term) ||
          (order.contactPhone || '').toLowerCase().includes(term) ||
          (order.orderMethod || '').toLowerCase().includes(term) ||
          (order.orderComment || '').toLowerCase().includes(term) ||
          (order.supplierName || '').toLowerCase().includes(term) ||
          (order.orderedBy || '').toLowerCase().includes(term)
      )
      : list;

    // sort list items based on rating status and order date
    return [...filtered].sort((a, b) => {
      const ratingDiff = Number(Boolean(a.ratingId)) - Number(Boolean(b.ratingId));

      if (ratingDiff !== 0) {
        return ratingDiff;
      }

      const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      return dateB - dateA;
    });
  });
}
