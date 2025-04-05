import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { format } from "date-fns";

interface Bonus {
  _id: string;
  amount: number;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const MyBonus: React.FC = () => {
  const { data: bonuses, isLoading } = useQuery<Bonus[]>({
    queryKey: ["my-bonuses"],
    queryFn: async () => {
      // Placeholder for actual API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              _id: "1",
              amount: 50000,
              description: "Performance Bonus Q1 2024",
              status: "APPROVED",
              createdAt: new Date().toISOString(),
            },
            {
              _id: "2",
              amount: 25000,
              description: "Project Completion Bonus",
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
          ]);
        }, 1000);
      });
    },
  });

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="p-4">
      <Typography variant="h5" component="h1" gutterBottom>
        My Bonuses
      </Typography>

      <div className="grid gap-4">
        {bonuses?.map((bonus) => (
          <Card key={bonus._id} className="shadow-md">
            <CardContent>
              <div className="flex justify-between items-start">
                <div>
                  <Typography variant="h6" component="h2">
                    {bonus.description}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Amount: ₦{bonus.amount.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">
                    Date: {format(new Date(bonus.createdAt), "MMM dd, yyyy")}
                  </Typography>
                </div>
                <div>
                  <Typography
                    className={`px-3 py-1 rounded-full text-sm ${
                      bonus.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : bonus.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {bonus.status}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!bonuses || bonuses.length === 0) && (
          <Card>
            <CardContent>
              <Typography color="textSecondary" align="center">
                No bonuses found
              </Typography>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyBonus;
