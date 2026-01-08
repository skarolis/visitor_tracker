import streamlit as st
import pandas as pd
from pathlib import Path
from datetime import datetime, date

# ---------- NUSTATYMAI ----------

DUOMENU_FAILAS = Path("lankytojai.csv")

st.set_page_config(
    page_title="Lankytojų stebėsena",
    page_icon="👥",
    layout="wide",
)

st.title("👥 Lankytojų stebėsena")
st.markdown(
    """
    <style>
    /* Pagrindinio puslapio fonas */
    .stApp {
        background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 40%, #f0f4ff 100%);
    }
    /* Antraštės */
    h1, h2, h3 {
        font-family: "Segoe UI", sans-serif;
        letter-spacing: 0.03em;
    }
    /* Formos mygtukas */
    button[kind="primary"] {
        background-color: #3b82f6 !important;
        border-radius: 999px !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ---------- PAGALBINĖS FUNKCIJOS ----------

def ikelti_duomenis() -> pd.DataFrame:
    """Įkelia CSV, jei yra, kitu atveju sukuria tuščią lentelę."""
    if DUOMENU_FAILAS.exists():
        df = pd.read_csv(DUOMENU_FAILAS)
        laukiami = [
            "iraso_id",
            "lankymo_data",
            "laiko_zenklas",
            "miestas",
            "bilieto_tipas",
            "priezastis",
            "lankymo_kartas",
            "praleistos_minutes",
            "lankytoju_sk",
            "iki_7",
            "nuo_7_iki_19",
            "nuo_20_iki_35",
            "nuo_36_iki_60",
            "nuo_61_ir_daugiau",
            "komentarai",
        ]
        truksta = [c for c in laukiami if c not in df.columns]
        if truksta:
            st.warning(
                "Rastas duomenų failas, tačiau jame trūksta šių stulpelių: "
                + ", ".join(truksta)
                + ". Sukuriama nauja tuščia lentelė."
            )
            return pd.DataFrame(columns=laukiami)
        return df
    else:
        return pd.DataFrame(
            columns=[
                "iraso_id",
                "lankymo_data",
                "laiko_zenklas",
                "miestas",
                "bilieto_tipas",
                "priezastis",
                "lankymo_kartas",
                "praleistos_minutes",
                "lankytoju_sk",
                "iki_7",
                "nuo_7_iki_19",
                "nuo_20_iki_35",
                "nuo_36_iki_60",
                "nuo_61_ir_daugiau",
                "komentarai",
            ]
        )


def issaugoti_duomenis(df: pd.DataFrame) -> None:
    """Išsaugo CSV faile."""
    df.to_csv(DUOMENU_FAILAS, index=False)


def gauti_kita_id(df: pd.DataFrame) -> int:
    """Sugeneruoja sekantį unikalų įrašo ID."""
    if len(df) == 0 or df["iraso_id"].isnull().all():
        return 1
    return int(df["iraso_id"].max()) + 1


# ---------- DUOMENŲ ĮKĖLIMAS ----------

df = ikelti_duomenis()
kitas_id = gauti_kita_id(df)

# ---------- ĮVESTIES FORMA ----------

st.header("📝 Įveskite naują įrašą")

with st.form("lankytoju_forma"):
    lankymo_data = st.date_input(
        "Lankymo data",
        value=date.today(),
        help="Pagal nutylėjimą šiandienos data. Keiskite, jei pildote senesnius duomenis.",
    )

    st.markdown("### Pagrindinė informacija")

    col1, col2 = st.columns(2)
    with col1:
        miestas = st.text_input("Miestas")
    with col2:
        lankymo_kartas = st.selectbox(
            "Lankymosi kartas",
            ["Pirmas kartas", "Antras kartas", "Trečias ar daugiau"],
            help="Pasirinkite, kelintas tai lankytojo (-ų) kartas.",
        )

    priezastis = st.selectbox(
        "Lankymosi priežastis",
        [
            "Renginys",
            "LC ekspozicija",
            "RRL ekspozicija",
            "Parko lankymas",
            "Fotosesija",
            "Kita",
        ],
    )

    praleistos_minutes = st.number_input(
        "Praleistas laikas (minutėmis, nebūtina)",
        min_value=0,
        step=5,
        help="Apytikslis laikas minutėmis. Jei nežinoma, palikite 0.",
    )

    st.markdown("### Amžiaus kategorijos (kiekvienam lankytojui)")
    st.caption(
        "Įveskite, kiek lankytojų patenka į kiekvieną amžiaus kategoriją: "
        "iki 7 m, 7–19, 20–35, 36–60, 61+."
    )

    col_a1, col_a2, col_a3 = st.columns(3)
    with col_a1:
        iki_7 = st.number_input("Iki 7 m.", min_value=0, step=1, value=0)
        nuo_20_iki_35 = st.number_input("20–35 m.", min_value=0, step=1, value=0)
    with col_a2:
        nuo_7_iki_19 = st.number_input("7–19 m.", min_value=0, step=1, value=0)
        nuo_36_iki_60 = st.number_input("36–60 m.", min_value=0, step=1, value=0)
    with col_a3:
        nuo_61_ir_daugiau = st.number_input("61+ m.", min_value=0, step=1, value=0)

    st.markdown("### Lankytojų skaičius ir bilietų tipai")
    st.caption("Naudokite, kai grupėje yra skirtingų bilietų tipų.")

    bendra_lankytoju_sk = st.number_input(
        "Bendras lankytojų skaičius grupėje",
        min_value=1,
        step=1,
        value=1,
    )

    col_b1, col_b2, col_b3 = st.columns(3)
    with col_b1:
        sk_standartiniai = st.number_input(
            "Standartiniai bilietai",
            min_value=0,
            step=1,
            value=0,
        )
    with col_b2:
        sk_studentu = st.number_input(
            "Studentų / moksleivių bilietai",
            min_value=0,
            step=1,
            value=0,
        )
    with col_b3:
        sk_senjoru = st.number_input(
            "Senjorų bilietai",
            min_value=0,
            step=1,
            value=0,
        )

    col_b4, col_b5 = st.columns(2)
    with col_b4:
        sk_nemokami = st.number_input(
            "Nemokami bilietai",
            min_value=0,
            step=1,
            value=0,
        )
    with col_b5:
        sk_kita = st.number_input(
            "Kiti bilietai",
            min_value=0,
            step=1,
            value=0,
        )

    grupes_komentaras = st.text_area(
        "Komentarai",
        placeholder="Pvz.: lankytojai džiaugėsi, kad priimami gyvūnai; patiko LC ekspozicija ir pan.",
    )

    pateikta = st.form_submit_button("💾 Išsaugoti įrašą", use_container_width=True)

if pateikta:
    if not miestas.strip():
        st.error("Prašome įvesti miestą.")
    else:
        bilietu_suma = (
            sk_standartiniai
            + sk_studentu
            + sk_senjoru
            + sk_nemokami
            + sk_kita
        )
        amziaus_suma = (
            iki_7
            + nuo_7_iki_19
            + nuo_20_iki_35
            + nuo_36_iki_60
            + nuo_61_ir_daugiau
        )

        if bilietu_suma != bendra_lankytoju_sk:
            st.error(
                f"Bilietų suma ({bilietu_suma}) turi sutapti su bendru lankytojų skaičiumi ({bendra_lankytoju_sk})."
            )
        elif amziaus_suma != bendra_lankytoju_sk:
            st.error(
                f"Amžiaus kategorijų suma ({amziaus_suma}) turi sutapti su bendru lankytojų skaičiumi ({bendra_lankytoju_sk})."
            )
        else:
            dabar = datetime.now()
            bazine_eilute = {
                "lankymo_data": lankymo_data.isoformat(),
                "laiko_zenklas": dabar.isoformat(timespec="seconds"),
                "miestas": miestas.strip(),
                "priezastis": priezastis,
                "lankymo_kartas": lankymo_kartas,
                "praleistos_minutes": praleistos_minutes if praleistos_minutes > 0 else None,
                "iki_7": iki_7,
                "nuo_7_iki_19": nuo_7_iki_19,
                "nuo_20_iki_35": nuo_20_iki_35,
                "nuo_36_iki_60": nuo_36_iki_60,
                "nuo_61_ir_daugiau": nuo_61_ir_daugiau,
                "komentarai": grupes_komentaras.strip(),
            }

            naujos_eilutes = []

            if sk_standartiniai > 0:
                r = bazine_eilute.copy()
                r["iraso_id"] = kitas_id
                r["bilieto_tipas"] = "Standartinis"
                r["lankytoju_sk"] = sk_standartiniai
                naujos_eilutes.append(r)
                kitas_id += 1

            if sk_studentu > 0:
                r = bazine_eilute.copy()
                r["iraso_id"] = kitas_id
                r["bilieto_tipas"] = "Studentų / moksleivių"
                r["lankytoju_sk"] = sk_studentu
                naujos_eilutes.append(r)
                kitas_id += 1

            if sk_senjoru > 0:
                r = bazine_eilute.copy()
                r["iraso_id"] = kitas_id
                r["bilieto_tipas"] = "Senjorų"
                r["lankytoju_sk"] = sk_senjoru
                naujos_eilutes.append(r)
                kitas_id += 1

            if sk_nemokami > 0:
                r = bazine_eilute.copy()
                r["iraso_id"] = kitas_id
                r["bilieto_tipas"] = "Nemokami"
                r["lankytoju_sk"] = sk_nemokami
                naujos_eilutes.append(r)
                kitas_id += 1

            if sk_kita > 0:
                r = bazine_eilute.copy()
                r["iraso_id"] = kitas_id
                r["bilieto_tipas"] = "Kiti"
                r["lankytoju_sk"] = sk_kita
                naujos_eilutes.append(r)
                kitas_id += 1

            naujas_df = pd.DataFrame(naujos_eilutes)
            df = pd.concat([df, naujas_df], ignore_index=True)
            issaugoti_duomenis(df)

            st.success("Įrašas sėkmingai išsaugotas. Duomenys įrašyti į failą „lankytojai.csv“.")  # aiški žinutė


# ---------- STATISTIKA ----------

st.header("📊 Lankytojų statistika")

if len(df) > 0:
    # konvertuojame skaitinius stulpelius
    for col in ["lankytoju_sk", "iki_7", "nuo_7_iki_19", "nuo_20_iki_35", "nuo_36_iki_60", "nuo_61_ir_daugiau"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    bendras_zmoniu_sk = int(df["lankytoju_sk"].sum())
    unikaliu_miestu = df["miestas"].nunique() if "miestas" in df.columns else 0
    dazniausias_bilietas = (
        df["bilieto_tipas"].mode().iloc[0] if df["bilieto_tipas"].notna().any() else "-"
    )

    # Sumos pagal amžiaus kategorijas
    suma_iki_7 = int(df["iki_7"].sum())
    suma_7_19 = int(df["nuo_7_iki_19"].sum())
    suma_20_35 = int(df["nuo_20_iki_35"].sum())
    suma_36_60 = int(df["nuo_36_iki_60"].sum())
    suma_61 = int(df["nuo_61_ir_daugiau"].sum())

    col_s1, col_s2, col_s3, col_s4 = st.columns(4)
    with col_s1:
        st.metric("Bendras žmonių skaičius", bendras_zmoniu_sk)
    with col_s2:
        st.metric("Unikalūs miestai", unikaliu_miestu)
    with col_s3:
        st.metric("Dažniausias bilieto tipas", dazniausias_bilietas)
    with col_s4:
        st.metric("Vaikai iki 7 m.", suma_iki_7)

    col_g1, col_g2 = st.columns(2)
    with col_g1:
        st.subheader("Pagal bilieto tipą (žmonių sk.)")
        st.bar_chart(
            df.groupby("bilieto_tipas")["lankytoju_sk"].sum()
        )

    with col_g2:
        st.subheader("Pagal lankymosi priežastį (žmonių sk.)")
        st.bar_chart(
            df.groupby("priezastis")["lankytoju_sk"].sum()
        )

    st.subheader("Amžiaus kategorijos (viso lankytojų)")
    amziaus_df = pd.DataFrame(
        {
            "Amžiaus kategorija": [
                "Iki 7 m.",
                "7–19 m.",
                "20–35 m.",
                "36–60 m.",
                "61+ m.",
            ],
            "Lankytojų skaičius": [
                suma_iki_7,
                suma_7_19,
                suma_20_35,
                suma_36_60,
                suma_61,
            ],
        }
    ).set_index("Amžiaus kategorija")

    st.bar_chart(amziaus_df)
else:
    st.info("Duomenų kol kas nėra. Įveskite naują įrašą viršuje, kad pradėtumėte.")
