import { useState, useEffect } from "react";
import axios from "axios";

const TransactionForm = ({ onTransactionAdded }) => {
  // formData stores the currently selected/entered values for each field.
  const [formData, setFormData] = useState({
    date: "",
    categorie: "",         // Changed from categories to categorie
    type_transaction: "",  // Changed from type_transactions to type_transaction
    amount: "",
    compte: "",            // Changed from comptes to compte
    beneficiaire: "",      // Changed from beneficiaires to beneficiaire
    frequence: "",         // Changed from frequences to frequence
    details: "",
    fuel_cost: ""
  });

  // newValues stores separate "new" values for each dropdown field.
  const [newValues, setNewValues] = useState({
    categorie: "",         // Changed field names to match backend
    type_transaction: "",
    compte: "",
    beneficiaire: "",
    frequence: ""
  });

  // dropdownData holds the list of options fetched from the API.
  const [dropdownData, setDropdownData] = useState({
    categories: [],
    types_frais: [],       // Changed to match API response
    comptes: [],
    beneficiaires: [],
    frequences: []
  });

  useEffect(() => {
    axios
      .get("https://finance-app-w0ya.onrender.com/get_dropdown_options")
      .then(response => {
        console.log("Dropdown Data:", response.data); // Debug log

        // Function to format options: remove empties, capitalize first letter, sort alphabetically (case-insensitive)
        const formatOptions = (options) => {
          return [...new Set(options)]
            .filter(option => option) // Remove empty values
            .map(option => option.charAt(0).toUpperCase() + option.slice(1).toLowerCase())
            .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
        };

        setDropdownData({
          categories: formatOptions(response.data.categories || []),
          types_frais: formatOptions(response.data.types_frais || []),
          comptes: formatOptions(response.data.comptes || []),
          beneficiaires: formatOptions(response.data.beneficiaires || []),
          frequences: formatOptions(response.data.frequences || [])
        });
      })
      .catch(error => console.error("Erreur lors du chargement des données:", error));
  }, []);

  // Standard change handler for form fields.
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Change handler for the new option input fields.
  const handleNewValueChange = (e, field) => {
    setNewValues({ ...newValues, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a copy of formData.
    let updatedFormData = { ...formData };

    // For each field that supports new values, if the user selected "new"
    // and provided a new value, update that field.
    Object.keys(newValues).forEach(field => {
      if (formData[field] === "new" && newValues[field]) {
        updatedFormData[field] = newValues[field];
      }
    });

    try {
      // Post the data to the backend. Format the date as YYYY-MM-DD.
      const response = await axios.post("https://finance-app-w0ya.onrender.com/add_entry", {
        ...updatedFormData,
        date: new Date(updatedFormData.date).toISOString().split("T")[0]
      });
      alert(response.data.message);
      onTransactionAdded();
      
      // Reset form after successful submission
      setFormData({
        date: "",
        categorie: "",
        type_transaction: "",
        amount: "",
        compte: "",
        beneficiaire: "",
        frequence: "",
        details: "",
        fuel_cost: ""
      });
      
      setNewValues({
        categorie: "",
        type_transaction: "",
        compte: "",
        beneficiaire: "",
        frequence: ""
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert("Erreur lors de l'ajout: " + (error.response?.data?.detail || error.message));
    }
  };

  // Mapping between frontend field names and dropdownData keys
  const fieldToDataMapping = {
    categorie: "categories",
    type_transaction: "types_frais",
    compte: "comptes",
    beneficiaire: "beneficiaires",
    frequence: "frequences"
  };

  // Mapping between backend field names and frontend labels
  const fieldLabels = {
    categorie: "Catégorie",
    type_transaction: "Type",
    compte: "Compte",
    beneficiaire: "Bénéficiaire",
    frequence: "Fréquence"
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow-md space-y-2">
      {/* Date */}
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        className="border p-2 rounded w-full"
        required
      />

      {/* Dropdown fields */}
      {Object.keys(fieldLabels).map(fieldName => (
        <div key={fieldName} className="relative">
          <select
            name={fieldName}
            value={formData[fieldName]}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">{`Sélectionner ${fieldLabels[fieldName]}`}</option>
            {dropdownData[fieldToDataMapping[fieldName]].map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
            <option value="new">+ Ajouter une nouvelle option</option>
          </select>

          {/* If the user selects "new", show an input field specific to this dropdown */}
          {formData[fieldName] === "new" && (
            <input
              type="text"
              placeholder={`Nouvelle ${fieldLabels[fieldName]}`}
              value={newValues[fieldName] || ""}
              onChange={(e) => handleNewValueChange(e, fieldName)}
              className="border p-2 rounded w-full mt-2"
            />
          )}
        </div>
      ))}

      {/* Montant */}
      <input
        type="number"
        name="amount"
        value={formData.amount}
        onChange={handleChange}
        placeholder="Montant (€)"
        className="border p-2 rounded w-full"
        required
      />

      {/* Détails */}
      <input
        type="text"
        name="details"
        value={formData.details}
        onChange={handleChange}
        placeholder="Détails"
        className="border p-2 rounded w-full"
      />

      {/* Carburant €/L */}
      <input
        type="number"
        step="0.01"
        name="fuel_cost"
        value={formData.fuel_cost}
        onChange={handleChange}
        placeholder="Carburant €/L"
        className="border p-2 rounded w-full"
      />

      <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
        Ajouter
      </button>
    </form>
  );
};

export default TransactionForm;
