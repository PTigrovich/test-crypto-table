import './App.css';
import { useState, useEffect } from 'react';

function App() {
    // Состояния для данных
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [columnFilters, setColumnFilters] = useState({
        rank: '',
        name: '',
        symbol: '',
        price_usd: '',
        percent_change_24h: '',
    });
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc',
    });

    // Загружаем данные при первом рендере
    useEffect(() => {
        fetchData();
    }, []);

    // Фильтрация данных по колонкам
    useEffect(() => {
        // Если все фильтры пустые - показываем все данные
        if (Object.values(columnFilters).every(filter => filter === '')) {
            setFilteredData(data);
            return;
        }

        const filtered = data.filter(coin => {
            // Фильтрация по колонкам
            if (columnFilters.rank && !coin.rank.toString().includes(columnFilters.rank)) {
                return false;
            }
            if (columnFilters.name && !coin.name.toLowerCase().includes(columnFilters.name.toLowerCase())) {
                return false;
            }
            if (columnFilters.symbol && !coin.symbol.toLowerCase().includes(columnFilters.symbol.toLowerCase())) {
                return false;
            }
            if (columnFilters.price_usd && !coin.price_usd.includes(columnFilters.price_usd)) {
                return false;
            }
            if (columnFilters.percent_change_24h && !coin.percent_change_24h.includes(columnFilters.percent_change_24h)) {
                return false;
            }

            return true;
        });

        setFilteredData(filtered);
    }, [columnFilters, data]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('https://api.coinlore.net/api/tickers/');

            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }

            const result = await response.json();

            setData(result.data);
            setFilteredData(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Функция для обработки сортировки
    const handleSort = key => {
        let direction = 'asc';

        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        setSortConfig({ key, direction });

        const sortedData = [...filteredData].sort((a, b) => {
            // Для числовых полей
            if (key === 'price_usd' || key === 'percent_change_24h' || key === 'rank') {
                const aValue = parseFloat(a[key]);
                const bValue = parseFloat(b[key]);

                if (direction === 'asc') {
                    return aValue - bValue;
                } else {
                    return bValue - aValue;
                }
            }

            // Для текстовых полей
            if (a[key] < b[key]) {
                return direction === 'asc' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        setFilteredData(sortedData);
    };

    // Функция для обновления фильтров колонок
    const handleColumnFilterChange = (column, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: value,
        }));
    };

    // Проверяем, есть ли активные фильтры
    const hasActiveFilters = Object.values(columnFilters).some(filter => filter !== '');

    return (
        <div className="App">
            <h1>Криптовалюты</h1>

            {loading && <div>Загрузка криптовалют...</div>}
            {error && <div>Ошибка: {error}</div>}
            {!loading && !error && (
                <table>
                    <thead>
                        <tr>
                            <th>
                                <div onClick={() => handleSort('rank')} className="sortable-header">
                                    Rank {sortConfig.key === 'rank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Фильтр..."
                                    value={columnFilters.rank}
                                    onChange={e => handleColumnFilterChange('rank', e.target.value)}
                                    className="column-filter-input"
                                />
                            </th>
                            <th>
                                <div onClick={() => handleSort('name')} className="sortable-header">
                                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Фильтр..."
                                    value={columnFilters.name}
                                    onChange={e => handleColumnFilterChange('name', e.target.value)}
                                    className="column-filter-input"
                                />
                            </th>
                            <th>
                                <div onClick={() => handleSort('symbol')} className="sortable-header">
                                    Symbol {sortConfig.key === 'symbol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Фильтр..."
                                    value={columnFilters.symbol}
                                    onChange={e => handleColumnFilterChange('symbol', e.target.value)}
                                    className="column-filter-input"
                                />
                            </th>
                            <th>
                                <div onClick={() => handleSort('price_usd')} className="sortable-header">
                                    Price (USD) {sortConfig.key === 'price_usd' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Фильтр..."
                                    value={columnFilters.price_usd}
                                    onChange={e => handleColumnFilterChange('price_usd', e.target.value)}
                                    className="column-filter-input"
                                />
                            </th>
                            <th>
                                <div onClick={() => handleSort('percent_change_24h')} className="sortable-header">
                                    24h Change {sortConfig.key === 'percent_change_24h' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Фильтр..."
                                    value={columnFilters.percent_change_24h}
                                    onChange={e => handleColumnFilterChange('percent_change_24h', e.target.value)}
                                    className="column-filter-input"
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(coin => (
                            <tr key={coin.id}>
                                <td>{coin.rank}</td>
                                <td>{coin.name}</td>
                                <td>{coin.symbol}</td>
                                <td>${parseFloat(coin.price_usd).toFixed(2)}</td>
                                <td style={{ color: coin.percent_change_24h >= 0 ? 'green' : 'red' }}>{coin.percent_change_24h}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {!loading && !error && filteredData.length === 0 && (
                <div className="not-found">{hasActiveFilters ? 'Ничего не найдено по текущим фильтрам' : 'Нет данных'}</div>
            )}
        </div>
    );
}

export default App;
