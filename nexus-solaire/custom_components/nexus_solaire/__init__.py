"""Nexus Solaire : tableaux de bord solaires HTML pour Home Assistant."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PAGES, URL_BASE


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Publie les pages et ajoute un onglet par page dans la barre latérale."""
    data = hass.data.setdefault(DOMAIN, {})
    if not data.get("static"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(URL_BASE, str(Path(__file__).parent / "www"), False)]
        )
        data["static"] = True

    for key, (title, icon) in PAGES.items():
        frontend.async_register_built_in_panel(
            hass,
            "iframe",
            sidebar_title=title,
            sidebar_icon=icon,
            frontend_url_path=f"nexus-{key}",
            config={"url": f"{URL_BASE}/{key}.html"},
            require_admin=False,
        )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Retire les onglets (les fichiers statiques restent servis jusqu'au redémarrage)."""
    for key in PAGES:
        frontend.async_remove_panel(hass, f"nexus-{key}")
    return True
