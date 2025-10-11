import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import axiosInstance from "../api/axiosInstance"; // garde ce chemin si ton dossier api/ est à la racine du projet

export default function Index() {
  const [message, setMessage] = useState("Chargement...");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axiosInstance.get("/status");
        setMessage(`✅ API Response: ${res.data.message}`);
      } catch (error) {
        setMessage("❌ Erreur : impossible de contacter l’API.");
        console.error("Erreur API:", error);
      }
    };
    fetchStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Event Manager Mobile</Text>
      <Text style={styles.response}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#007bff",
  },
  response: {
    fontSize: 16,
    marginTop: 10,
  },
});
