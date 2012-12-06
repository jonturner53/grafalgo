IDIR = ../../include
LDIR = ../../lib
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64  -I ${IDIR}

LIBFILES = HashMap.o HashSet.o HashTbl.o  IdMap.o 

.cpp.o : %.cpp %.h ${IDIR}/stdinc.h
	${CXX} ${CXXFLAGS} -c $<

all : ${LIBFILES}
	ar -ru ${LDIR}/lib-ds.a ${LIBFILES}

clean :
	make -C unit clean
	rm -f *.o
