import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

function App() {
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tfCount, setTfCount] = useState('');
  const [daCount, setDaCount] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Fetch all entries once
  useEffect(() => {
    axios
      .get(`${API_URL}/all/data`, {
        headers: { 'x-api-key': API_KEY },
      })
      .then((res) => setData(res.data))
      .catch((err) => {
        setError('Error fetching data');
        console.error(err);
      });
  }, []);

  // Fetch data for selected date
  useEffect(() => {
    const formatted = format(selectedDate, 'dd/MM/yyyy');
    axios
      .get(`${API_URL}/data?date=${formatted}`, {
        headers: { 'x-api-key': API_KEY },
      })
      .then((res) => {
        setSelectedData(res.data);
        setTfCount(res.data.tf_count);
        setDaCount(res.data.da_count);
        setMessage('Entry already exists for this date');
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setSelectedData(null);
          setTfCount('');
          setDaCount('');
          setMessage('No entry found — you can add one.');
        } else {
          setError('Error fetching selected date data');
          console.error(err);
        }
      });
  }, [selectedDate]);

  // Add or Update handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedDate = format(selectedDate, 'dd/MM/yyyy');

    const newData = {
      tf_count: tfCount,
      da_count: daCount,
    };

    const url = selectedData
      ? `${API_URL}/update?date=${formattedDate}`
      : `${API_URL}/add`;

    const method = selectedData ? 'put' : 'post';

    axios({
      method: method,
      url: url,
      data: selectedData ? newData : { ...newData, date: formattedDate },
      headers: { 'x-api-key': API_KEY },
    })
      .then(() => {
        const updated = { date: formattedDate, ...newData };

        if (selectedData) {
          setData((prev) =>
            prev.map((item) =>
              item.date === formattedDate ? updated : item
            )
          );
          setMessage('Data updated successfully');
        } else {
          setData([...data, updated]);
          setMessage('Data added successfully');
        }

        setSelectedData(updated);
        setError(null);
      })
      .catch((err) => {
        setError('Error submitting data');
        console.error(err);
      });
  };

  return (
    <div className="App">
      <h1>Daily Count</h1>
    
      <Calendar onChange={setSelectedDate} value={selectedDate} />

      <h2>Entry for {format(selectedDate, 'dd/MM/yyyy')}</h2>
      {selectedData ? (
        <p>TF: {selectedData.tf_count}, DA: {selectedData.da_count}</p>
      ) : (
        <p>No data for this date yet.</p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="TF Count"
          value={tfCount}
          onChange={(e) => setTfCount(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="DA Count"
          value={daCount}
          onChange={(e) => setDaCount(e.target.value)}
          required
        />
        <div id='Button'>
        <button type="submit">
          {selectedData ? 'Update Entry' : 'Add Data'}
        </button>
        {selectedData && (
          <button
            type="button"
            onClick={() => {
              setSelectedData(null);
              setTfCount('');
              setDaCount('');
              setMessage('');
            }}
          >
            Cancel Edit
          </button>
        )}

        </div>
      </form>

      {message && <p className="info">{message}</p>}
      {error && <p className="error">{error}</p>}

      <button onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Hide All Entries' : 'Show All Entries'}
      </button>

      {showAll && (
        <div>
          <h2>All Entries</h2>
          <ul>
            {data.map((item, idx) => (
              <li key={idx}>
                {item.date}: TF = {item.tf_count}, DA = {item.da_count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
