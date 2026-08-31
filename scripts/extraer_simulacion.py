# -*- coding: utf-8 -*-
"""
Convierte el Excel de simulacion en un JSON con la forma de las tablas.

    python scripts/extraer_simulacion.py
    python scripts/extraer_simulacion.py --excel "ruta/al/archivo.xlsx"

No toca la base: solo escribe db/simulacion.json, para poder revisar lo que se
va a cargar antes de cargarlo. La carga la hace scripts/simulacion.js.

El Excel tiene 13 hojas de etapa, cada una con el titulo en la fila 1, el
origen del dato en la 2, una nota en la 3 y las cabeceras en la 5.

Los valores de lista abierta del Excel se traducen a los valores cerrados que
aceptan los CHECK de la base ('Cancha (cachi)' -> 'cachi'). El texto original
nunca se pierde: viaja en observaciones.
"""

import argparse
import json
import math
import os
import sys
from datetime import date, datetime

try:
    import pandas as pd
except ImportError:
    sys.exit("Falta pandas.  pip install pandas openpyxl")

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL_POR_DEFECTO = os.path.join(
    os.path.expanduser("~"), "Downloads", "BD_Simulacion_Cadena_ASOCAFE.xlsx")

# Fila de cabeceras dentro de cada hoja (0-based).
CABECERA = 4


# ---------------------------------------------------------------- utilidades

def limpio(v):
    """Normaliza un valor de celda a algo que Postgres acepte."""
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    if isinstance(v, str):
        v = v.strip()
        return v or None
    if hasattr(v, "item"):          # numpy int64 / float64
        v = v.item()
    return v


def num(v):
    v = limpio(v)
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def entero(v):
    n = num(v)
    return None if n is None else int(round(n))


def si_no(v):
    """'Si'/'No' del Excel -> booleano. Cualquier otra cosa es None."""
    v = limpio(v)
    if v is None:
        return None
    return str(v).strip().lower() in ("si", "sí", "s", "true", "1")


def texto(*partes):
    """Une trozos de observacion saltando los vacios."""
    return " · ".join(str(p) for p in partes if p not in (None, "", "nan"))


def kg(v):
    n = num(v)
    return None if n is None else f"{n:,.1f}".replace(",", "@").replace(".", ",").replace("@", ".")


def hoja(xl, nombre):
    df = xl.parse(nombre, header=CABECERA)
    # La primera columna es un ID de registro del propio Excel; no se usa.
    return df


def filas(df):
    for _, f in df.iterrows():
        if limpio(f.get("LOTE")) or limpio(f.get("LOTE SIGUIENTE")) or limpio(f.get("FECHA EMBARQUE")):
            yield f


# ------------------------------------------------- traducciones a lista cerrada

def tipo_secado(v):
    t = (limpio(v) or "").lower()
    if "tarima" in t:
        return "tarima"
    if "cachi" in t or "cancha" in t:
        return "cachi"
    if "guardiola" in t:
        return "guardiola"
    if "hibrido" in t or "híbrido" in t:
        return "hibrido"
    return None


def destino_sultana(v):
    t = (limpio(v) or "").lower()
    if "combustible" in t:
        return "combustible"
    if "venta" in t:
        return "venta"
    if "familia" in t:
        return "entrega_familias"
    if "compost" in t or "abono" in t:
        return "compost"
    return None


def tipo_limpieza(v):
    t = (limpio(v) or "").lower()
    if "profunda" in t or "cip" in t:
        return "profunda"
    if "rapida" in t or "rápida" in t:
        return "rapida"
    return None


def calidad_agua(v):
    """El CHECK de la base solo admite limpia/turbia; el detalle va aparte."""
    t = (limpio(v) or "").lower()
    if "turbia" in t or "sucia" in t:
        return "turbia"
    return "limpia" if t else None


# ---------------------------------------------------------------- extraccion

def extraer(ruta):
    xl = pd.ExcelFile(ruta)
    salida = {}

    # ---- E01 tolva -> etapa_tolva
    salida["etapa_tolva"] = [{
        "lote": limpio(f["LOTE"]),
        "kg_entrada": num(f["PESO ENTRADA KG"]),
        "tolva": limpio(f["TOLVA ASIGNADA"]),
        "limpieza_previa": si_no(f["TOLVA LIMPIA ANTES"]),
        "hora_limpieza": limpio(f["HORA LIMPIEZA"]),
        "responsable_limpieza": limpio(f["RESPONSABLE LIMPIEZA"]),
        "hora_inicio": limpio(f["INICIO DESCARGA"]),
        "hora_fin": limpio(f["FIN DESCARGA"]),
        "operario": limpio(f["OPERARIO"]),
        "estado": "completada",
        # La jornada no tiene columna en la base: el sistema solo modela lotes
        # de exportacion. Se conserva aqui para no perder el dato.
        "observaciones": texto(
            f"Jornada {limpio(f['JORNADA'])}",
            f"salida {kg(f['PESO SALIDA KG'])} kg",
            f"merma {kg(f['MERMA KG'])} kg",
            limpio(f["OBSERVACIONES"])),
    } for f in filas(hoja(xl, "E01_Descarga_Tolva"))]

    # ---- E02 despulpado -> etapa_despulpado (+ sultana aparte)
    e02 = list(filas(hoja(xl, "E02_Despulpado")))
    salida["etapa_despulpado"] = [{
        "lote": limpio(f["LOTE"]),
        "maquina": limpio(f["MAQUINA ASIGNADA"]),
        "hora_inicio": limpio(f["HORA INICIO"]),
        "hora_fin": limpio(f["HORA FIN"]),
        "operario": limpio(f["OPERARIO"]),
        "limpieza_validada": si_no(f["LIMPIEZA VALIDADA"]),
        "responsable_limpieza": limpio(f["RESPONSABLE LIMPIEZA"]),
        "temperatura_c": num(f["TEMPERATURA MAQUINA C"]),
        "velocidad_rpm": entero(f["VELOCIDAD RPM"]),
        "kg_entrada": num(f["PESO ENTRADA KG"]),
        "kg_despulpado": num(f["CAFE DESPULPADO KG"]),
        # kg_sultana y destino_sultana se dejan vacios a proposito: la sultana
        # tiene tabla propia y dos fuentes darian dos destinos distintos.
        "estado": "completada",
        "incidencias": texto(f"Jornada {limpio(f['JORNADA'])}", limpio(f["INCIDENCIAS"])),
    } for f in e02]

    salida["sultana"] = [{
        "lote": limpio(f["LOTE"]),
        "fecha": limpio(f["FECHA"]),
        "kg_sultana": num(f["SULTANA PRODUCIDA KG"]),
        "destino": destino_sultana(f["DESTINO SULTANA"]),
        "responsable": limpio(f["RESPONSABLE SULTANA"]),
        "observaciones": texto(
            f"Jornada {limpio(f['JORNADA'])}",
            f"destino declarado: {limpio(f['DESTINO SULTANA'])}"),
    } for f in e02]

    # ---- E03 fermentacion
    salida["etapa_fermentacion"] = [{
        "lote": limpio(f["LOTE"]),
        "tanque": limpio(f["TANQUE ASIGNADO"]),
        "kg_entrada": num(f["PESO ENTRADA KG"]),
        "hora_inicio": limpio(f["INICIO FERMENTACION"]),
        "hora_fin": limpio(f["FIN FERMENTACION"]),
        "mucilago_despegado": si_no(f["MUCILAGO SE DESPEGA"]),
        "responsable": limpio(f["RESPONSABLE VALIDACION"]),
        "estado": "completada",
        "observaciones": texto(
            f"Jornada {limpio(f['JORNADA'])}",
            f"{entero(f['DURACION HORAS'])} h",
            f"ambiente {num(f['TEMPERATURA AMBIENTE C'])} C",
            f"salida {kg(f['PESO SALIDA KG'])} kg",
            f"merma {kg(f['MERMA KG'])} kg",
            limpio(f["OBSERVACIONES"])),
    } for f in filas(hoja(xl, "E03_Fermentacion"))]

    # ---- E04 lavado
    salida["etapa_lavado"] = [{
        "lote": limpio(f["LOTE"]),
        "hora_inicio": limpio(f["INICIO LAVADO"]),
        "hora_fin": limpio(f["FIN LAVADO"]),
        "encargado": limpio(f["ENCARGADO"]),
        "operarios": limpio(f["OPERARIOS"]),
        "calidad_agua": calidad_agua(f["CALIDAD AGUA"]),
        "temperatura_agua_c": num(f["TEMPERATURA AGUA C"]),
        "carretillas": entero(f["NUMERO CARRETILLAS"]),
        "kg_por_carretilla": num(f["PESO POR CARRETILLA KG"]),
        "segregacion_ok": si_no(f["SEGREGACION MANTENIDA"]),
        "estado": "completada",
        "observaciones": texto(
            f"Jornada {limpio(f['JORNADA'])}",
            f"orden {entero(f['ORDEN PROCESAMIENTO'])}",
            f"agua: {limpio(f['CALIDAD AGUA'])}",
            f"vano descartado {kg(f['CAFE VANO DESCARTADO KG'])} kg",
            f"salida mote {kg(f['PESO SALIDA MOTE KG'])} kg",
            f"limpieza posterior del canal: {limpio(f['LIMPIEZA CANAL POSTERIOR'])}",
            limpio(f["OBSERVACIONES"])),
    } for f in filas(hoja(xl, "E04_Lavado_Correteo"))]

    # ---- E05 secado
    salida["etapa_secado"] = [{
        "lote": limpio(f["LOTE"]),
        "tipo_secado": tipo_secado(f["TIPO SECADO"]),
        "fecha_inicio": limpio(f["FECHA INICIO"]),
        "fecha_fin": limpio(f["FECHA FIN"]),
        "temperatura_inicial_c": num(f["TEMPERATURA INICIAL C"]),
        "humedad_inicial_pct": num(f["HUMEDAD RELATIVA INICIAL PCT"]),
        "humedad_final_pct": num(f["HUMEDAD FINAL PCT"]),
        "validador_humedad": limpio(f["VALIDADOR HUMEDAD"]),
        "kg_entrada": num(f["PESO ENTRADA KG"]),
        "kg_pergamino_seco": num(f["PERGAMINO SECO KG"]),
        "perdida_agua_kg": num(f["PERDIDA AGUA KG"]),
        "carretillas_traslado": entero(f["CARRETILLAS TRASLADO"]),
        "fecha_traslado": limpio(f["FECHA TRASLADO ALMACEN"]),
        "estado": "completada",
        "observaciones": texto(
            f"Jornada {limpio(f['JORNADA'])}",
            f"{limpio(f['TIPO SECADO'])}",
            f"{entero(f['DIAS SECADO'])} dias",
            limpio(f["OBSERVACIONES"])),
    } for f in filas(hoja(xl, "E05_Secado"))]

    # ---- E06 almacen temporal
    salida["etapa_almacen_temporal"] = [{
        "lote": limpio(f["LOTE"]),
        "fecha_ingreso": limpio(f["FECHA INGRESO"]),
        "ubicacion": limpio(f["UBICACION ALMACEN"]),
        "temperatura_c": num(f["TEMPERATURA ALMACEN C"]),
        "humedad_pct": num(f["HUMEDAD ALMACEN PCT"]),
        "kg_acumulado": num(f["PESO ACUMULADO KG"]),
        "lotes_diarios": texto(
            f"{entero(f['JORNADAS ACUMULADAS'])} jornadas",
            f"{entero(f['ENTREGAS DEL LOTE'])} entregas de acopio",
            f"{kg(f['GUINDA ORIGEN KG'])} kg de guinda de origen"),
        "responsable": limpio(f["RESPONSABLE"]),
        "estado": "completada",
        "observaciones": limpio(f["OBSERVACIONES"]),
    } for f in filas(hoja(xl, "E06_Almacen_Lote"))]

    # ---- E07 transporte + E08 recepcion -> UPDATE sobre envios
    #
    # No se insertan filas: los 9 envios de la campana ya existen con su peso
    # y su fecha reales. La simulacion solo rellena lo que hoy esta vacio.
    recep = {limpio(f["LOTE"]): f for f in filas(hoja(xl, "E08_Recepcion_ElAlto"))}
    envios = []
    for f in filas(hoja(xl, "E07_Transporte")):
        lote = limpio(f["LOTE"])
        r = recep.get(lote)
        envios.append({
            "lote": lote,
            "nota_remision": limpio(f["NOTA REMISION"]),
            "numero_bolsas": entero(f["NUMERO BOLSAS"]),
            "vehiculo": limpio(f["PLACA VEHICULO"]),
            "conductor": limpio(f["CONDUCTOR"]),
            "responsable_transportista": limpio(f["TRANSPORTISTA"]),
            "responsable": limpio(f["RESPONSABLE DESPACHO"]),
            "remitente": limpio(f["ORIGEN"]),
            "destinatario": limpio(f["DESTINO"]),
            "documentos_verificados": si_no(r["NOTA REMISION COINCIDE"]) if r is not None else None,
            # El peso despachado NO se toca: el de la base es el real.
            "fecha_llegada": limpio(r["FECHA RECEPCION"]) if r is not None else None,
            "kg_pergamino_recibido": num(r["PESO RECIBIDO KG"]) if r is not None else None,
            "observaciones": texto(
                f"Sello de seguridad {limpio(f['SELLO SEGURIDAD'])}",
                limpio(f["OBSERVACIONES"]),
                None if r is None else texto(
                    f"Recepcion: {limpio(r['ESTADO LOTE'])}",
                    f"{entero(r['BOLSAS RECIBIDAS'])} bolsas",
                    f"humedad {num(r['HUMEDAD INICIAL PCT'])} %",
                    f"{num(r['TEMPERATURA C'])} C",
                    f"recibio {limpio(r['RECEPCIONISTA'])}")),
        })
    salida["envios"] = envios

    # ---- E09 limpieza de equipos
    salida["limpiezas_equipo"] = [{
        "lote_siguiente": limpio(f["LOTE SIGUIENTE"]),
        "equipo": limpio(f["EQUIPO"]),
        "fecha_hora": limpio(f["FECHA HORA"]),
        "tipo_limpieza": tipo_limpieza(f["TIPO LIMPIEZA"]),
        "duracion_min": entero(f["DURACION MINUTOS"]),
        "responsable": limpio(f["RESPONSABLE TECNICO"]),
        # lote_previo viene como texto ('Lote anterior de transicion'), no como
        # codigo: no se puede resolver a un id, se conserva escrito.
        "insumos": texto(
            limpio(f["INSUMOS UTILIZADOS"]),
            f"previo: {limpio(f['LOTE PREVIO'])}",
            f"verificacion PLC: {limpio(f['VERIFICACION PLC'])}",
            limpio(f["OBSERVACIONES"])),
    } for f in filas(hoja(xl, "E09_Limpieza_Equipos"))]

    # ---- E10 trillado
    salida["etapa_trillado"] = [{
        "lote": limpio(f["LOTE"]),
        "fecha_inicio": limpio(f["FECHA INICIO"]),
        "fecha_fin": limpio(f["FECHA FIN"]),
        "kg_pergamino_entrada": num(f["PESO PERGAMINO ENTRADA KG"]),
        "kg_verde_sin_seleccionar": num(f["VERDE SIN SELECCIONAR KG"]),
        "kg_cascarilla": num(f["CASCARILLA KG"]),
        "kg_caracol": num(f["CARACOL KG"]),
        "kg_descarte_mecanico": num(f["DESCARTE MECANICO KG"]),
        "rendimiento_pct": num(f["RENDIMIENTO TRILLADO PCT"]),
        "operador": limpio(f["OPERADOR"]),
        "equipo_linea": limpio(f["EQUIPO LINEA"]),
        "estado": "completada",
        "observaciones": limpio(f["OBSERVACIONES"]),
    } for f in filas(hoja(xl, "E10_Trillado"))]

    # ---- E11 seleccion
    salida["etapa_seleccion"] = [{
        "lote": limpio(f["LOTE"]),
        "fecha_inicio": limpio(f["FECHA INICIO"]),
        "fecha_fin": limpio(f["FECHA FIN"]),
        "kg_asignado": num(f["PESO ASIGNADO KG"]),
        "kg_devuelto": num(f["PESO DEVUELTO KG"]),
        "kg_defectos": num(f["DEFECTOS RETIRADOS KG"]),
        "tasa_defecto_pct": num(f["TASA DEFECTO PCT"]),
        "seleccionadoras": entero(f["NUMERO SELECCIONADORAS"]),
        "kg_por_seleccionadora": num(f["KG POR SELECCIONADORA"]),
        "balance_cuadra": si_no(f["BALANCE CUADRA"]),
        "responsable": limpio(f["RESPONSABLE"]),
        "estado": "completada",
        "observaciones": limpio(f["OBSERVACIONES"]),
    } for f in filas(hoja(xl, "E11_Seleccion"))]

    # ---- E12 empaque
    salida["etapa_empaque"] = [{
        "lote": limpio(f["LOTE"]),
        "fecha_ingreso": limpio(f["FECHA INGRESO"]),
        "kg_verde_oro": num(f["PESO VERDE ORO KG"]),
        "tipo_empaque": limpio(f["TIPO EMPAQUE"]),
        "numero_sacos": entero(f["NUMERO SACOS"]),
        "kg_por_saco": num(f["KG POR SACO"]),
        "ubicacion": limpio(f["UBICACION ALMACEN"]),
        "temperatura_c": num(f["TEMPERATURA C"]),
        "humedad_pct": num(f["HUMEDAD RELATIVA PCT"]),
        "responsable": limpio(f["RESPONSABLE"]),
        "estado": "completada",
        "observaciones": limpio(f["OBSERVACIONES"]),
    } for f in filas(hoja(xl, "E12_Empaque"))]

    # ---- E13 exportacion -> UPDATE sobre despachos y exportaciones
    #
    # Los dos embarques ya existen con su volumen real. La simulacion solo
    # completa contenedor, precintos, puerto y naviera, que hoy estan vacios.
    salida["exportaciones"] = [{
        "fecha_embarque": limpio(f["FECHA EMBARQUE"]),
        "contenedor": limpio(f["NUMERO CONTENEDOR"]),
        "precintos": limpio(f["PRECINTOS"]),
        "puerto_salida": limpio(f["PUERTO SALIDA"]),
        "naviera": limpio(f["NAVIERA"]),
        "certificaciones": [c.strip() for c in (limpio(f["CERTIFICACIONES"]) or "").split(";") if c.strip()],
        "responsable": limpio(f["RESPONSABLE"]),
        "observaciones": texto(
            f"Comprador {limpio(f['COMPRADOR'])} ({limpio(f['PAIS DESTINO'])})",
            f"lotes {limpio(f['LOTES INTEGRADOS'])}",
            f"ICO {limpio(f['CODIGO ICO'])}",
            f"documentos: {limpio(f['DOCUMENTOS'])}",
            limpio(f["OBSERVACIONES"])),
    } for f in filas(hoja(xl, "E13_Exportacion"))]

    return salida


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--excel", default=EXCEL_POR_DEFECTO)
    p.add_argument("--out", default=os.path.join(RAIZ, "db", "simulacion.json"))
    args = p.parse_args()

    if not os.path.exists(args.excel):
        sys.exit(f"No existe el Excel: {args.excel}")

    datos = extraer(args.excel)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(datos, fh, ensure_ascii=False, indent=1)

    total = sum(len(v) for v in datos.values())
    print(f"Escrito {args.out}")
    for k, v in datos.items():
        print(f"  {k:<26} {len(v):>4}")
    print(f"  {'TOTAL':<26} {total:>4}")

    # Aviso si alguna traduccion a lista cerrada dejo un hueco.
    for tabla, campo in (("etapa_secado", "tipo_secado"), ("sultana", "destino"),
                         ("limpiezas_equipo", "tipo_limpieza"), ("etapa_lavado", "calidad_agua")):
        vacios = [r for r in datos[tabla] if r.get(campo) is None]
        if vacios:
            print(f"  AVISO: {len(vacios)} filas de {tabla} sin {campo} reconocido")


if __name__ == "__main__":
    main()
