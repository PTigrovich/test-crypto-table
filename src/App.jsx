import { useState, useEffect } from 'react';



function App() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [filteredData, setFilteredData] = useState([]);

    const [filters, setFilters] = useState({}); //Добавляем state для фильтров

    const [searchTerm, setSearchTerm] = useState(''); // хранит значение глобального поиска

    // Функция загрузки данных с API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://api.coinlore.net/api/tickers/');
                const result = await res.json();
                setData(result.data); // сохраняем криптовалюты в state
                setFilteredData(result.data); //Когда данные загружаются, filteredData должен совпадать с data. Инициализируем рабочий массив после загрузки
            } catch (err) {
                setError(err.message); // если ошибка — сохраняем сообщение
            } finally {
                setLoading(false); // в любом случае отключаем "Загрузка..."
            }
        };

        fetchData(); // вызов при монтировании компонента
    }, []);

    //умная сортировка для столбцов по клику
    const handleSort = key => {
        let direction = 'asc';

        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else if (sortConfig.direction === 'desc') {
                setSortConfig({ key: null, direction: null });
                setFilteredData([...data]); // сброс
                return;
            }
        }

        setSortConfig({ key, direction });

        const sorted = [...filteredData].sort((a, b) => {
            const aVal = String(a[key] ?? '');
            const bVal = String(b[key] ?? '');

            return direction === 'asc'
                ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
                : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' });
        });

        setFilteredData(sorted);
    };

    //Обновляем фильтры по вводу
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        // применяем фильтры к оригинальным данным
        let filtered = [...data];
        Object.keys(newFilters).forEach(col => {
            if (newFilters[col]) {
                filtered = filtered.filter(item => String(item[col]).toLowerCase().includes(newFilters[col].toLowerCase()));
            }
        });

        setFilteredData(filtered);
    };

    //обработчик изменения глобального поиска
    const handleGlobalSearch = value => {
        setSearchTerm(value); // сохраняем текст поиска

        let filtered = [...data];

        // применяем фильтр глобально по всем ключам
        if (value.trim() !== '') {
            const lowerValue = value.toLowerCase();
            filtered = filtered.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(lowerValue)));
        }

        // учитываем текущие колоночные фильтры
        Object.keys(filters).forEach(col => {
            if (filters[col]) {
                filtered = filtered.filter(item => String(item[col]).toLowerCase().includes(filters[col].toLowerCase()));
            }
        });

        setFilteredData(filtered);
    };

    // Основной рендер таблицы
    return (
        <div>
            <h1>Криптовалюты</h1>
            <input //Глобальный поиск
                type="text"
                placeholder="Глобальный поиск..."
                value={searchTerm}
                onChange={e => handleGlobalSearch(e.target.value)}
                style={{ marginBottom: '10px', width: '50%', padding: '5px' }}
            />
            {loading && <div>Загрузка криптовалют...</div>}
            {error && <div>Ошибка: {error}</div>}
            {!loading && !error && data.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            {Object.keys(data[0] || {}).map(key => (
                                <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer' }}>
                                    {key}
                                    {sortConfig.key === key && <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {Object.keys(data[0] || {}).map(key => (
                                <th key={key}>
                                    <input
                                        type="text"
                                        value={filters[key] || ''}
                                        onChange={e => handleFilterChange(key, e.target.value)}
                                        placeholder="Фильтр"
                                        style={{ width: '90%' }}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map(coin => (
                                <tr key={coin.id}>
                                    {Object.keys(data[0]).map(key => (
                                        <td key={key}>{coin[key]}</td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={Object.keys(data[0] || {}).length} style={{ textAlign: 'center' }}>
                                    Нет данных
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default App;

