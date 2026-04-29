import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ListSearch } from '../../components/list-search/list-search';
import { AddBtn } from '../../components/add-btn/add-btn';
import { LucideAngularModule, User } from 'lucide-angular';
import { NgbModal, NgbModalOptions, NgbOffcanvas, NgbOffcanvasOptions } from '@ng-bootstrap/ng-bootstrap';
import { ToastComponent } from '../../components/toast/toast.component';
import { ListItem } from '../../components/list-item/list-item';
import { ModalFormSupplierComponent } from '../../components/modal-form-supplier/modal-form-supplier';
import { PanelFormSupplierComponent } from '../../components/panel-form-supplier/panel-form-supplier';
import { DefaultService, SupplierCreateDTO, SupplierSummaryDTO, SupplierUpdateDTO } from '../../openapi-gen';
import { ListItemHeadersComponent } from '../../components/list-item-headers/list-item-headers.component';

@Component({
  selector: 'app-suppliers',
  imports: [ListSearch, AddBtn, ToastComponent, LucideAngularModule, ListItem, ListItemHeadersComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersComponent implements OnInit {
  /**
   * Lucide Icon
   * @protected
   */
  protected readonly UserIcon = User;

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
   * Injected SupplierService
   * @private
   */
  private supplierService: DefaultService = inject(DefaultService);

  /**
   * Injected DestroyRef for cleaning up subscriptions
   * @private
   */
  private destroyRef = inject(DestroyRef);

  /**
   * State: List of all suppliers
   */
  readonly suppliers = signal<SupplierSummaryDTO[]>([]);

  /**
   * State: Selected supplier ID
   */
  readonly selectedSupplierId = signal<string | null>(null);

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
    this.loadSuppliers();
  }

  /**
   * Loads supplier-data from the service and updates the signal state
   * If an error occurs, an error message should be displayed.
   */
  private loadSuppliers() {
    this.errorMessage.set(null);
    this.supplierService
      .getAllSuppliers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.suppliers.set(data);
        },
        error: () => {
          this.errorMessage.set(
            'Laden der Lieferanten fehlgeschlagen. Bitte überprüfe deine Verbindung und versuche erneut.'
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
   * Select Supplier and show Offcanvas with data-details
   * @param supplier The supplier to select
   */
  selectSupplier(supplier: SupplierSummaryDTO) {
    // Set selected supplier ID (for changing active state of list-item)
    this.selectedSupplierId.set(supplier.id);

    // Open Offcanvas
    const offcanvasRef = this.offCanvasService.open(PanelFormSupplierComponent, this.offCanvasOptions);

    // Send data into Offcanvas Component
    // We need to fetch the full details to get the orders and stats if they are missing in summary
    this.supplierService.getSupplierById(supplier.id).subscribe({
      next: fullSupplier => {
        offcanvasRef.componentInstance.supplier.set(fullSupplier);
      },
      error: () => {
        // Fallback to summary if detail fetch fails, though stats might be missing
        offcanvasRef.componentInstance.supplier.set(supplier);
        this.errorMessage.set('Konnte Details nicht laden.');
      },
    });
  }

  /**
   * Opens Modal for adding or editing a supplier
   */
  openSupplierModal() {
    this.handleSupplierModal();
  }

  /**
   * Opens the modal in edit mode for an existing supplier
   * @param supplier The supplier to edit
   */
  openEditSupplierModal(supplier: SupplierSummaryDTO) {
    this.handleSupplierModal(supplier);
  }

  /**
   * Internal helper to manage the supplier modal lifecycle for both create and update actions.
   * @param supplier Optional supplier for edit mode
   * @private
   */
  private handleSupplierModal(supplier?: SupplierSummaryDTO) {
    const modalRef = this.modalService.open(ModalFormSupplierComponent, this.modalOptions);

    if (supplier) {
      // Highlight item while editing
      this.selectedSupplierId.set(supplier.id);
      modalRef.componentInstance.supplier.set(supplier);
    }

    modalRef.result.then(
      (result: SupplierCreateDTO) => {
        this.selectedSupplierId.set(null); // Reset highlight
        if (!result) return;

        if (supplier?.id) {
          this.updateExistingSupplier(supplier.id, result);
        } else {
          this.createAndAddSupplier(result);
        }
      },
      reason => {
        this.selectedSupplierId.set(null); // Reset highlight
        if (reason !== 0 && reason !== 1 && reason !== undefined) {
          console.log(reason);
          this.errorMessage.set(`Fehler beim Bearbeiten des Eintrages: ${reason}`);
        }
      }
    );
  }

  /**
   * Creates a new supplier and adds it to the list view
   * @param formData
   * @private
   */
  private createAndAddSupplier(formData: SupplierCreateDTO) {
    this.supplierService
      .createSupplier(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          /* loadSuppliers will refresh the whole list, which is simpler than trying to merge the new supplier into the existing list, because the backend might add additional data (like id, timestamps, etc.) that we don't have on the client side. */
          this.loadSuppliers();
          // Show success message
          this.successMessage.set(`Lieferant "${formData.name}" wurde erfolgreich erstellt.`);
        },
        error: () => this.errorMessage.set(`Fehler beim Speichern: ${formData.name}`),
      });
  }

  /**
   * Updates an existing supplier and refreshes the local state
   * @param id The stable identifier
   * @param formData The updated data from the form
   * @private
   */
  private updateExistingSupplier(id: string, formData: SupplierUpdateDTO) {
    const existing = this.suppliers().find(s => s.id === id);
    const updatedPayload = { ...existing, ...formData, id };

    this.supplierService
      .updateSupplier(id, updatedPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.loadSuppliers();
          this.selectSupplier(updated);
        },
        error: () => this.errorMessage.set('Fehler beim Aktualisieren.'),
      });
  }

  /**
   * Filters AND sorts the list of suppliers based on the current search term.
   * @description Computed Signal: Automatically recalculates the list, if the search term OR the list changes.
   * 1. Filter the list of suppliers based on the search term
   * 2. Sort the filtered list alphabetically by name
   */
  readonly filteredSuppliers = computed(() => {
    // 1. filter the list of suppliers based on the search term
    const list = this.suppliers();
    const term = this.searchTerm().toLowerCase();

    // filter the list of suppliers based on the search term.
    // We check multiple fields for a match, and if any of them include the search term, we keep that supplier in the list.
    // if (term) { ... } else { return list; } means: if there is a search term, filter the list, otherwise return the original list without filtering.
    const filtered = term
      ? list.filter(
          supplier =>
            // Suche im Namen
            (supplier.name || '').toLowerCase().includes(term) ||
            // PLZ
            (supplier.zipCode || '').toLowerCase().includes(term) ||
            // Stadt
            (supplier.city || '').toLowerCase().includes(term) ||
            // Kundennummer
            (supplier.customerNumber || '').toLowerCase().includes(term) ||
            // Strasse
            (supplier.street || '').toLowerCase().includes(term) ||
            // Webseite
            (supplier.website || '').toLowerCase().includes(term) ||
            // Mehrwertsteuer-ID
            (supplier.vatId || '').toLowerCase().includes(term) ||
            // Postfach
            (supplier.poBox || '').toLowerCase().includes(term) ||
            // E-Mail
            (supplier.email || '').toLowerCase().includes(term) ||
            // Telefon
            (supplier.phoneNumber || '').toLowerCase().includes(term)
        )
      : list;

    // sort the filtered list alphabetically by name. We use localeCompare for proper alphabetical sorting,
    // and we handle the case where name might be null or undefined by defaulting to an empty string.
    return [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  });
}
