import heapq
import math
from dataclasses import dataclass, field
from app.models import Location, VehicleStats, RouteStep, RouteResult


@dataclass(order=True)
class SearchNode:
    """
    A single state in the priority queue, sorted automatically by lowest f_score.
    Note that for EV routing, traversing the same physical intersection twice isn't
    necessarily a loop if the vehicle arrives with a different battery level.
    """

    f_score: float
    g_score: float = field(compare=False)
    node_id: str = field(compare=False)
    current_battery: float = field(compare=False)
    parent: "SearchNode" | None = field(default=None, compare=False)


def calculate_heuristic(current: Location, destination: Location) -> float:
    """
    Estimate the remaining cost to the destination.
    A simple straight line works as a baseline, but the earth is a sphere.
    Optimize for energy retention?
    """
    # Baseline Euclidean distance
    return math.sqrt((current.lat - destination.lat) ** 2 + (current.lng - destination.lng) ** 2)


def get_neighbors(node_id: str) -> list[dict]:
    """
    Retrieve adjacent nodes in the road network.
    This will need to pull from a local map graph (OSMnx) to find valid
    connected road segments, distance, speed limits, and elevation.
    """
    return []  # e.g.,[{"node_id": "NODE_B", "distance_km": 5.0, "elevation_change_m": -10.0}]


def calculate_energy_cost(distance: float, elevation_change: float, vehicle: VehicleStats) -> float:
    """
    Compute the battery drain for a specific road segment.
    A flat road drains battery at a predictable rate. However, elevation changes
    physics drastically.
    """
    return distance * vehicle.consumption_rate_kwh_per_km


def find_ev_route(start: Location, destination: Location, vehicle: VehicleStats) -> RouteResult | None:
    """
    Evaluate paths to find the optimal route to the destination.
    Standard A* optimizes for shortest path; this variant must ensure the
    battery constraint remains above 0 at all times.
    """
    open_set: list[SearchNode] = []

    # In a real implementation, coordinates would snap to the nearest road network node ID
    start_node_id = "START_NODE"
    dest_node_id = "DEST_NODE"

    start_node = SearchNode(
        f_score=calculate_heuristic(start, destination),
        g_score=0,
        node_id=start_node_id,
        current_battery=vehicle.current_battery_kwh,
    )

    heapq.heappush(open_set, start_node)

    # Track the highest battery level we've had when reaching a specific node
    # If we reach a known node but with less battery, it's a sub-optimal path (not considering recharging yet)
    best_battery_at_node: dict[str, float] = {start_node_id: vehicle.current_battery_kwh}

    while open_set:
        current = heapq.heappop(open_set)

        if current.node_id == dest_node_id:
            return reconstruct_path(current)

        neighbors = get_neighbors(current.node_id)

        for edge in neighbors:
            neighbor_id = edge["node_id"]
            distance = edge["distance_km"]
            elevation = edge.get("elevation_change_m", 0.0)

            energy_used = calculate_energy_cost(distance, elevation, vehicle)
            new_battery_level = current.current_battery - energy_used

            # Out of power
            if new_battery_level <= 0:
                continue

            tentative_g_score = current.g_score + distance

            # Only explore this path if it's our first time reaching this node or if this new path leaves us in a better battery state than before
            if neighbor_id not in best_battery_at_node or new_battery_level > best_battery_at_node[neighbor_id]:
                best_battery_at_node[neighbor_id] = new_battery_level

                # Mock location for the heuristic (would normally fetch node coordinates)
                mock_neighbor_loc = Location(lat=0.0, lng=0.0)

                h_score = calculate_heuristic(mock_neighbor_loc, destination)
                f_score = tentative_g_score + h_score

                neighbor_node = SearchNode(
                    f_score=f_score,
                    g_score=tentative_g_score,
                    node_id=neighbor_id,
                    current_battery=new_battery_level,
                    parent=current,
                )

                heapq.heappush(open_set, neighbor_node)

    return None


def reconstruct_path(end_node: SearchNode) -> RouteResult:
    """
    Traces back through the parent node references to build the final route sequence.
    Think about how to store the path metadata—total distance, time, and the
    battery levels at each waypoint—in a way the frontend can easily consume.
    """
    path_nodes = []
    curr = end_node

    while curr:
        # Reconstruct coordinates here from node_id lookup
        path_nodes.append(
            RouteStep(location=Location(lat=0.0, lng=0.0), battery_remaining=curr.current_battery, is_charging_stop=False)
        )
        curr = curr.parent

    # Path is reconstructed backwards
    path_nodes.reverse()

    # Calculate totals based on the path nodes
    return RouteResult(total_distance_km=end_node.g_score, total_time_mins=0.0, steps=path_nodes)
