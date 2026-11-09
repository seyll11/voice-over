package org.delcom.usernamepbo2026springbootcashflow.framework.view;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.grid.ColumnTextAlign;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Image;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.NotificationVariant;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import org.delcom.usernamepbo2026springbootcashflow.adapter.presenter.FinancePresenter;
import org.delcom.usernamepbo2026springbootcashflow.domain.entity.SortOption;
import org.delcom.usernamepbo2026springbootcashflow.domain.entity.Transaction;
import org.delcom.usernamepbo2026springbootcashflow.domain.entity.TransactionType;
import org.delcom.usernamepbo2026springbootcashflow.domain.exception.DomainException;
import org.delcom.usernamepbo2026springbootcashflow.domain.exception.EntityNotFoundException;
import org.delcom.usernamepbo2026springbootcashflow.domain.exception.ValidationException;
import org.delcom.usernamepbo2026springbootcashflow.usecase.FinanceUseCase;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * Tampilan web Cashflow. View hanya berinteraksi dengan use case dan presenter;
 * semua exception domain ditangkap lalu ditampilkan lewat Notification.
 */
@Route("")
@PageTitle("Cashflow")
public class FinanceView extends VerticalLayout {
    private final FinanceUseCase useCase;
    private final FinancePresenter presenter;

    private final Grid<Transaction> grid = new Grid<>(Transaction.class, false);
    private final TextField searchField = new TextField();
    private final ComboBox<SortOption> sortBox = new ComboBox<>();
    private final Paragraph statusLabel = new Paragraph();
    private final Span emptyState = new Span();

    private final Span countValue = new Span("0");
    private final Span incomeValue = new Span();
    private final Span expenseValue = new Span();
    private final Span balanceValue = new Span();

    public FinanceView(FinanceUseCase useCase, FinancePresenter presenter) {
        this.useCase = useCase;
        this.presenter = presenter;

        setSizeFull();
        getElement().setAttribute("role", "main");
        setPadding(true);
        setSpacing(true);

        configureGrid();
        configureToolbarFields();
        add(buildHeader(), buildSummary(), buildToolbar(), statusLabel, grid);
        refreshAll();
    }

    // ---------- header ----------

    private HorizontalLayout buildHeader() {
        Image avatar = new Image("images/profile.jpg", "Foto profil Doo");
        avatar.setWidth("44px");
        avatar.setHeight("44px");
        avatar.getStyle().set("border-radius", "50%").set("object-fit", "cover")
                .set("border", "2px solid #3730A3");

        Span author = new Span("By Doo");
        author.getStyle().set("font-weight", "700").set("font-size", "1rem");

        HorizontalLayout profile = new HorizontalLayout(avatar, author);
        profile.setAlignItems(FlexComponent.Alignment.CENTER);
        profile.setSpacing(true);

        HorizontalLayout header = new HorizontalLayout(new H1("Cashflow"), profile);
        header.setWidthFull();
        header.setAlignItems(FlexComponent.Alignment.CENTER);
        header.setJustifyContentMode(FlexComponent.JustifyContentMode.BETWEEN);
        header.getStyle().set("flex-wrap", "wrap");
        return header;
    }

    // ---------- ringkasan ----------

    private HorizontalLayout buildSummary() {
        HorizontalLayout row = new HorizontalLayout(
                card("Total Transaksi", countValue, "#E0E7FF", "#3730A3"),
                card("Total Pemasukan", incomeValue, "#DCFCE7", "#166534"),
                card("Total Pengeluaran", expenseValue, "#FEE2E2", "#991B1B"),
                card("Saldo", balanceValue, "#FEF9C3", "#854D0E")
        );
        row.setWidthFull();
        row.getStyle().set("align-items", "stretch").set("flex-wrap", "wrap");
        return row;
    }

    private Div card(String label, Span value, String background, String accent) {
        Span caption = new Span(label);
        caption.getStyle().set("display", "block").set("font-size", "0.9rem").set("color", accent);
        value.getStyle().set("display", "block").set("font-size", "1.5rem")
                .set("font-weight", "700").set("color", accent);
        Div box = new Div(caption, value);
        box.getStyle().set("flex", "1 1 160px").set("min-width", "0").set("background", background)
                .set("border-left", "6px solid " + accent).set("border-radius", "10px")
                .set("padding", "0.9rem 1rem");
        return box;
    }

    private void updateSummary() {
        countValue.setText(String.valueOf(useCase.getAllTransactions().size()));
        incomeValue.setText(presenter.formatMoney(useCase.getTotalIncome()));
        expenseValue.setText(presenter.formatMoney(useCase.getTotalExpense()));
        balanceValue.setText(presenter.formatMoney(useCase.getBalance()));
    }

    // ---------- grid ----------

    private void configureGrid() {
        grid.addColumn(Transaction::getId).setHeader("ID").setKey("id")
                .setAutoWidth(true).setFlexGrow(0).setSortable(true)
                .setComparator(Comparator.comparing(Transaction::getId));
        grid.addColumn(Transaction::getDescription).setHeader("Keterangan").setKey("description")
                .setFlexGrow(1).setSortable(true)
                .setComparator(Comparator.comparing(Transaction::getDescription, String.CASE_INSENSITIVE_ORDER));
        grid.addColumn(t -> presenter.formatMoney(t.getAmount())).setHeader("Jumlah").setKey("amount")
                .setAutoWidth(true).setTextAlign(ColumnTextAlign.END).setSortable(true)
                .setComparator(Comparator.comparing(Transaction::getAmount));
        grid.addComponentColumn(this::typeBadge).setHeader("Tipe").setKey("type")
                .setAutoWidth(true).setFlexGrow(0).setSortable(true)
                .setComparator(Comparator.comparing(Transaction::isIncome));
        grid.addColumn(presenter::formatCreatedAt).setHeader("Waktu").setKey("createdAt")
                .setAutoWidth(true).setSortable(true)
                .setComparator(Comparator.comparing(Transaction::getCreatedAt));
        grid.addComponentColumn(this::deleteButton).setHeader("Tindakan").setKey("action")
                .setAutoWidth(true).setFlexGrow(0).setSortable(false);
        grid.setEmptyStateComponent(emptyState);
        grid.setSizeFull();
        grid.getElement().setAttribute("aria-label", "Daftar transaksi");
        grid.setMinHeight("300px");
    }

    private Span typeBadge(Transaction t) {
        Span badge = new Span(presenter.formatType(t.getType()));
        badge.getElement().getThemeList().add(t.isIncome() ? "badge success" : "badge error");
        return badge;
    }

    private Button deleteButton(Transaction t) {
        Button button = new Button("Hapus", VaadinIcon.TRASH.create(), e -> openDeleteDialog(t));
        button.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_TERTIARY_INLINE);
        return button;
    }

    // ---------- toolbar ----------

    private void configureToolbarFields() {
        searchField.setLabel("Cari keterangan");
        searchField.setPlaceholder("Cari keterangan...");
        searchField.setPrefixComponent(VaadinIcon.SEARCH.create());
        searchField.setClearButtonVisible(true);

        sortBox.setLabel("Urutkan");
        sortBox.setPlaceholder("Urutkan...");
        sortBox.setItems(SortOption.values());
        sortBox.setItemLabelGenerator(presenter::formatSortOption);
        sortBox.addValueChangeListener(e -> {
            if (e.getValue() != null && e.isFromClient()) {
                applySort(e.getValue());
            }
        });
    }

    private HorizontalLayout buildToolbar() {
        Button search = new Button("Cari", VaadinIcon.SEARCH.create(), e -> search());
        Button reload = new Button("Muat Ulang", VaadinIcon.REFRESH.create(), e -> refreshAll());
        Button income = new Button("Pemasukan", VaadinIcon.PLUS.create(), e -> openAddDialog(TransactionType.INCOME));
        income.addThemeVariants(ButtonVariant.LUMO_SUCCESS, ButtonVariant.LUMO_PRIMARY);
        Button expense = new Button("Pengeluaran", VaadinIcon.MINUS.create(), e -> openAddDialog(TransactionType.EXPENSE));
        expense.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_PRIMARY);

        HorizontalLayout bar = new HorizontalLayout(searchField, search, sortBox, reload, income, expense);
        bar.setWidthFull();
        bar.setFlexGrow(1, searchField);
        bar.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.END);
        bar.getStyle().set("flex-wrap", "wrap");
        return bar;
    }

    // ---------- dialog ----------

    private void openAddDialog(TransactionType type) {
        boolean income = type == TransactionType.INCOME;
        TextField description = new TextField("Keterangan");
        description.setWidthFull();
        TextField amount = new TextField("Jumlah (Rp)");
        amount.setPlaceholder("contoh: 1000000");
        amount.setWidthFull();

        Dialog dialog = new Dialog();
        dialog.setHeaderTitle(income ? "Tambah Pemasukan" : "Tambah Pengeluaran");
        dialog.setWidth("420px");
        dialog.add(new VerticalLayout(description, amount));

        Button save = new Button("Simpan", VaadinIcon.CHECK.create(), e -> {
            try {
                Transaction created = income
                        ? useCase.addIncome(description.getValue(), amount.getValue())
                        : useCase.addExpense(description.getValue(), amount.getValue());
                showSuccess(presenter.showAddSuccess(created));
                dialog.close();
                refreshAll();
            } catch (ValidationException ex) {
                showError(presenter.showValidationError(ex.getMessage()));
            }
        });
        save.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        Button cancel = new Button("Batal", e -> dialog.close());
        dialog.getFooter().add(cancel, save);
        dialog.open();
    }

    private void openDeleteDialog(Transaction t) {
        Dialog dialog = new Dialog();
        dialog.setHeaderTitle("Hapus Transaksi");
        dialog.add(new Paragraph("Yakin ingin menghapus " + presenter.format(t) + " ?"));

        Button confirm = new Button("Hapus", VaadinIcon.TRASH.create(), e -> {
            deleteTransaction(t);
            dialog.close();
        });
        confirm.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_ERROR);
        Button cancel = new Button("Batal", e -> dialog.close());
        dialog.getFooter().add(cancel, confirm);
        dialog.open();
    }

    // ---------- aksi ----------

    private void deleteTransaction(Transaction t) {
        try {
            useCase.removeTransaction(t.getId());
            showSuccess(presenter.showRemoveSuccess());
            refreshAll();
        } catch (EntityNotFoundException ex) {
            showError(presenter.showRemoveFailed(ex.getId()));
            refreshAll();
        } catch (DomainException ex) {
            showError(presenter.showValidationError(ex.getMessage()));
        }
    }

    private void search() {
        String keyword = searchField.getValue();
        if (keyword.isBlank()) {
            refreshAll();
            return;
        }
        List<Transaction> results = useCase.searchTransactions(keyword);
        emptyState.setText(presenter.showNotFound());
        show(results, "Hasil Pencarian: \"" + keyword.trim() + "\"");
    }

    private void applySort(SortOption option) {
        emptyState.setText(presenter.showEmpty());
        show(useCase.sortTransactions(option), "Daftar Transaksi (" + presenter.formatSortOption(option) + ")");
    }

    private void refreshAll() {
        searchField.clear();
        sortBox.clear();
        emptyState.setText(presenter.showEmpty());
        show(useCase.getAllTransactions(), "Daftar Transaksi");
    }

    private void show(List<Transaction> items, String title) {
        grid.sort(Collections.emptyList());
        grid.setItems(items);
        updateSummary();
        statusLabel.setText(title + " | " + presenter.showBalance(useCase.getBalance()));
    }

    private void showSuccess(String message) {
        Notification n = Notification.show(message, 3000, Notification.Position.BOTTOM_START);
        n.addThemeVariants(NotificationVariant.LUMO_SUCCESS);
    }

    private void showError(String message) {
        Notification n = Notification.show(message, 4000, Notification.Position.BOTTOM_START);
        n.addThemeVariants(NotificationVariant.LUMO_ERROR);
    }
}
