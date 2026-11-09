package org.delcom.usernamepbo2026springbootcashflow.adapter.repository;

import org.delcom.usernamepbo2026springbootcashflow.domain.repository.IRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * Basis generic in-memory repository.
 *
 * @param <T>  tipe entitas
 * @param <ID> tipe identifier
 */
public abstract class InMemoryRepository<T, ID> implements IRepository<T, ID> {
    protected final List<T> data = new ArrayList<>();
    private final Function<T, ID> idExtractor;

    protected InMemoryRepository(Function<T, ID> idExtractor) {
        this.idExtractor = idExtractor;
    }

    @Override
    public List<T> findAll() {
        // Salinan defensif agar list internal tidak bisa dimutasi dari luar
        return new ArrayList<>(data);
    }

    @Override
    public Optional<T> findById(ID id) {
        return data.stream().filter(e -> idExtractor.apply(e).equals(id)).findFirst();
    }

    @Override
    public T save(T entity) {
        data.add(entity);
        return entity;
    }

    @Override
    public boolean deleteById(ID id) {
        return data.removeIf(e -> idExtractor.apply(e).equals(id));
    }

    @Override
    public void update(T entity) {
        // Objek mutable disimpan by-reference; tidak perlu aksi tambahan.
    }

    @Override
    public List<T> findBy(Predicate<T> predicate) {
        return data.stream().filter(predicate).toList();
    }
}
