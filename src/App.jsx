import './App.css';
import { useState, useEffect } from 'react';

function App() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [columnFilters, setColumnFilters] = useState({});
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc',
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = data;

        // фильтрация по колонкам
        if (!Object.values(columnFilters).every(filter => filter === '')) {
            filtered = filtered.filter(coin =>
                Object.keys(columnFilters).every(key => {
                    const filterValue = columnFilters[key];
                    if (!filterValue) return true;
                    return coin[key]?.toString().toLowerCase().includes(filterValue.toLowerCase());
                })
            );
        }

        // глобальный поиск
        if (globalSearch.trim() !== '') {
            const search = globalSearch.toLowerCase();
            filtered = filtered.filter(coin => Object.values(coin).some(val => val?.toString().toLowerCase().includes(search)));
        }

        setFilteredData(filtered);
    }, [columnFilters, data, globalSearch]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('https://api.coinlore.net/api/tickers/');
            if (!response.ok) throw new Error('Ошибка загрузки данных');

            const result = await response.json();
            setData(result.data);
            setFilteredData(result.data);

            // инициализируем фильтры
            const initialFilters = {};
            Object.keys(result.data[0]).forEach(key => {
                initialFilters[key] = '';
            });
            setColumnFilters(initialFilters);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = key => {
        let direction = 'asc';

        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                // третий клик → сброс
                setSortConfig({ key: null, direction: null });

                // пересчёт без сортировки (фильтры + глобальный поиск)
                let filtered = data.filter(coin =>
                    Object.keys(columnFilters).every(k => {
                        const filterValue = columnFilters[k];
                        if (!filterValue) return true;
                        return coin[k]?.toString().toLowerCase().includes(filterValue.toLowerCase());
                    })
                );

                if (globalSearch.trim() !== '') {
                    const search = globalSearch.toLowerCase();
                    filtered = filtered.filter(coin => Object.values(coin).some(val => val?.toString().toLowerCase().includes(search)));
                }

                setFilteredData(filtered);
                return;
            }
        }

        setSortConfig({ key, direction });

        const sortedData = [...filteredData].sort((a, b) => {
            const aValue = parseFloat(a[key]);
            const bValue = parseFloat(b[key]);

            if (!isNaN(aValue) && !isNaN(bValue)) {
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredData(sortedData);
    };

    const handleColumnFilterChange = (column, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: value,
        }));
    };

    const hasActiveFilters = Object.values(columnFilters).some(filter => filter !== '') || globalSearch.trim() !== '';

    return (
        <div className="App">
            <h1>Криптовалюты</h1>

            {/* 🔎 Глобальный поиск */}
            <input
                type="text"
                placeholder="Поиск по всем колонкам..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="global-search-input"
                style={{ marginBottom: '10px', padding: '5px', width: '300px' }}
            />

            {loading && <div>Загрузка криптовалют...</div>}
            {error && <div>Ошибка: {error}</div>}

            {!loading && !error && data.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            {Object.keys(data[0]).map(key => (
                                <th key={key}>
                                    <div onClick={() => handleSort(key)} className="sortable-header">
                                        {key} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Фильтр..."
                                        value={columnFilters[key] || ''}
                                        onChange={e => handleColumnFilterChange(key, e.target.value)}
                                        className="column-filter-input"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(coin => (
                            <tr key={coin.id}>
                                {Object.keys(data[0]).map(key => (
                                    <td
                                        key={key}
                                        style={
                                            key === 'percent_change_24h'
                                                ? {
                                                      color: coin[key] >= 0 ? 'green' : 'red',
                                                  }
                                                : {}
                                        }
                                    >
                                        {key === 'price_usd' ? `$${parseFloat(coin[key]).toFixed(2)}` : coin[key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {!loading && !error && filteredData.length === 0 && (
                <div className="not-found">{hasActiveFilters ? 'Ничего не найдено по текущим фильтрам или поиску' : 'Нет данных'}</div>
            )}
        </div>
    );
}

export default App;
