import { useState, useEffect } from "react";
import axios from "axios";

const TransactionForm = ({ onTransactionAdded }) => {
    const [formData, setFormData] = useState({
        date: "",
        titre: "",
        type_transaction: "",
        amount: "",
        compte: "",
        beneficiaire: "",
        frequence: "",
        details: "",
        fuel_cost: ""
    });

    const [newValues, setNewValues] = useState({
        titre: "",
        type_transaction: "",
        compte: "",
        beneficiaire: "",
        frequence: ""
    });


    const [dropdownData, setDropdownData] = useState({
        categories: [],
        type_transactions: [],
        comptes: [],
        beneficiaires: [],
        frequences: []
    });

    useEffect(() => {
        axios.get("https://finance-app-w0ya.onrender.com/get_dropdown_options")
            .then(response => {
                console.log("Dropdown Data:", response.data);  // Debugging log
                const formatOptions = (options) => {
                    return [...new Set(options)]
                        .filter(option => option)  // Remove empty values
                        .map(option => option.charAt(0).toUpperCase() + option.slice(1).toLowerCase())  // Capitalize first letter
                        .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));  // Case-insensitive sorting
                };
                
                setDropdownData({
                    categories: formatOptions(response.data.categories || []),
                    type_transactions: formatOptions(response.data.types_frais || []),
                    comptes: formatOptions(response.data.comptes || []),
                    beneficiaires: formatOptions(response.data.beneficiaires || []),
                    frequences: formatOptions(response.data.frequences || [])
                });
            })
            .catch(error => console.error("Erreur lors du chargement des données:", error));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNewValueChange = (e, field) => {
        setNewValues({ ...newValues, [field]: e.target.value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        let updatedFormData = { ...formData };

        // If user added a new value, replace the field with new_value
            Object.keys(newValues).forEach(field => {
                if (formData[field] === "new" && newValues[field]) {
                    updatedFormData[field] = newValues[field];
                }
            });

        try {
            const response = await axios.post("https://finance-app-w0ya.onrender.com/add_entry", {
                ...updatedFormData,
                date: new Date(updatedFormData.date).toISOString().split("T")[0]
            });
            alert(response.data.message);
            onTransactionAdded();
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded shadow-md space-y-2">
            {/* Date */}
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="border p-2 rounded w-full" required />

            {/* Dropdown fields */}
            {[
                { name: "titre", label: "Catégorie", options: dropdownData.categories },
                { name: "type_transaction", label: "Type", options: dropdownData.type_transactions },
                { name: "compte", label: "Compte", options: dropdownData.comptes },
                { name: "beneficiaire", label: "Bénéficiaire", options: dropdownData.beneficiaires },
                { name: "frequence", label: "Fréquence", options: dropdownData.frequences }
            ].map(({ name, label, options }) => (
                <div key={name} className="relative">
                    <select name={name} value={formData[name]} onChange={handleChange} className="border p-2 rounded w-full" required>
                        <option value="">{`Sélectionner ${label}`}</option>
                        {options.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                        ))}
                        <option value="new">+ Ajouter une nouvelle option</option>
                    </select>
                    
                    {/* If user selects "new", show an input field */}
                    {formData[name] === "new" && (
                        <input
                            type="text"
                            placeholder={`Nouvelle ${label}`}
                            value={newValues[name] || ""}
                            onChange={(e) => handleNewValueChange(e, name)}
                            className="border p-2 rounded w-full mt-2"
                        />
                    )}
                </div>
            ))}

            {/* Montant */}
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="Montant (€)" className="border p-2 rounded w-full" required />

            {/* Détails */}
            <input type="text" name="details" value={formData.details} onChange={handleChange} placeholder="Détails" className="border p-2 rounded w-full" />

            {/* Carburant €/L */}
            <input type="number" step="0.01" name="fuel_cost" value={formData.fuel_cost} onChange={handleChange} placeholder="Carburant €/L" className="border p-2 rounded w-full" />

            <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Ajouter</button>
        </form>
    );
};

export default TransactionForm;
