import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./Form.module.css";
import Message from "./Message";
import Spinner from "./Spinner";
import Button from "./Button";
import BackButton from "./BackButton";
import { useCities } from "../contexts/CitiesContexts";
import { useUrlPosition } from "../hooks/useUrlPosition";
import { useNavigate } from "react-router-dom";

// eslint-disable-next-line react-refresh/only-export-components
export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
  const [isLoadingGeocoding, setisLoadingGeocoding] = useState(false);
  const { createCity, isLoading } = useCities();
  const navigate = useNavigate();
  const [lat, lng] = useUrlPosition();
  const [country, setCountry] = useState("");
  const [cityName, setCityName] = useState("");
  const [date, setDate] = useState(new Date()); // Initialize date to today
  const [notes, setNotes] = useState("");
  const [geocodingError, setGeoCodingError] = useState("");
  const [emoji, setEmoji] = useState("");

  useEffect(() => {
    if (!lat || !lng) return;
    async function fetchCityData() {
      try {
        setisLoadingGeocoding(true);
        setGeoCodingError("");
        const res = await fetch(`${BASE_URL}?latitude=${lat}&longitude=${lng}`);
        const data = await res.json();
        if (!data.countryCode)
          throw new Error(
            "That doesn't seem to be a city. Click somewhere else 😄"
          );
        setCityName(data.city || data.locality || "");
        setCountry(data.countryCode);
        setEmoji(convertToEmoji(data.countryCode)); // Updated to set the emoji state
      } catch (err) {
        setGeoCodingError(err.message);
      } finally {
        setisLoadingGeocoding(false);
      }
    }
    fetchCityData();
  }, [lat, lng]);

  const handlePrimaryButtonClick = () => {
    console.log("City Name:", cityName);
    console.log("Date:", date);
    console.log("Notes:", notes);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cityName || !date) return;
    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };
    await createCity(newCity);
    navigate("/app/cities");
  }

  if (isLoadingGeocoding) return <Spinner />;
  if (!lat && !lng)
    return <Message message="Start by clicking somewhere on the map" />;
  if (geocodingError) return <Message message={geocodingError} />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>{emoji}</span> {/* Utilizing emoji */}
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>
        {/* <input
          type="date"
          id="date"
          onChange={(e) => setDate(e.target.value)}
          value={date}
        /> */}
        <DatePicker
          id="date"
          onChange={(date) => setDate(date)}
          selected={date}
          dateFormat="dd/MM/yyyy"
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary" onClick={handlePrimaryButtonClick}>
          Add
        </Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
