from pydantic import BaseModel


class Location(BaseModel):
    lat: float
    lng: float


class VehicleStats(BaseModel):
    current_battery_kwh: float
    max_battery_kwh: float
    consumption_rate_kwh_per_km: float  # Simplified
    # TODO: Add weight, weather, tire friction, etc.


class RouteRequest(BaseModel):
    start: Location
    destination: Location
    vehicle: VehicleStats


class RouteStep(BaseModel):
    location: Location
    battery_remaining: float
    is_charging_stop: bool


class RouteResult(BaseModel):
    total_distance_km: float
    total_time_mins: float
    steps: list[RouteStep]
