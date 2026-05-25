import { partnerRepository } from "../repositories/partner.repository";

const TEST_PARTNERS = [
  {
    name: "Ritu Grooming",
    phone: "9100000001",
    latitude: 23.03096,
    longitude: 72.51857,
    services: ["GROOMING"],
  },
  {
    name: "Mehul Grooming",
    phone: "9100000002",
    latitude: 23.0232,
    longitude: 72.5714,
    services: ["GROOMING"],
  },
  {
    name: "Tara Grooming",
    phone: "9100000003",
    latitude: 23.01191,
    longitude: 72.50456,
    services: ["GROOMING"],
  },
  {
    name: "Dr. Karan Home Vet",
    phone: "9100000011",
    latitude: 23.0205,
    longitude: 72.53,
    services: ["VET_ON_CALL"],
  },
  {
    name: "Dr. Nidhi Home Vet",
    phone: "9100000012",
    latitude: 23.03957,
    longitude: 72.566,
    services: ["VET_ON_CALL"],
  },
  {
    name: "Dr. Parth Home Vet",
    phone: "9100000013",
    latitude: 23.0501,
    longitude: 72.60,
    services: ["VET_ON_CALL"],
  },
  {
    name: "CanoVet Clinic - Satellite",
    phone: "9100000021",
    latitude: 23.03096,
    longitude: 72.51857,
    services: ["VET_CLINIC"],
  },
  {
    name: "CanoVet Clinic - Prahlad Nagar",
    phone: "9100000022",
    latitude: 23.01191,
    longitude: 72.50456,
    services: ["VET_CLINIC"],
  },
  {
    name: "CanoVet Clinic - Bodakdev",
    phone: "9100000023",
    latitude: 23.0445,
    longitude: 72.5273,
    services: ["VET_CLINIC"],
  },
  {
    name: "CanoVet Clinic - Navrangpura",
    phone: "9100000024",
    latitude: 23.037,
    longitude: 72.566,
    services: ["VET_CLINIC"],
  },
  {
    name: "CanoVet Clinic - Maninagar",
    phone: "9100000025",
    latitude: 22.9972,
    longitude: 72.6021,
    services: ["VET_CLINIC"],
  },
];

export const partnerService = {
  async listForTesting() {
    return partnerRepository.listForTesting();
  },

  async seedTestingPartners() {
    const city =
      (await partnerRepository.findFirstCity()) ??
      (await partnerRepository.createTestingCity());

    await partnerRepository.deleteByPhones(TEST_PARTNERS.map((p) => p.phone));
    const partners = [];

    for (const row of TEST_PARTNERS) {
      const partner = await partnerRepository.upsertTestPartner({
        name: row.name,
        phone: row.phone,
        latitude: row.latitude,
        longitude: row.longitude,
        cityId: city.id,
      });

      for (const serviceType of row.services) {
        await partnerRepository.ensureService(partner.id, serviceType);
      }

      partners.push(partner);
    }

    return partners;
  },
};
